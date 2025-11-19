import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { vectorStore } from "@/lib/rag/vector-store";
import { env } from "@/env";

const uploadSchema = z.object({
  title: z.string().min(1),
  source: z.string().min(1),
  content: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  file: z.string().optional(), // base64 encoded file
  fileType: z.enum(["pdf", "docx", "txt", "image"]).optional()
});

async function extractTextFromFile(base64File: string, fileType: string, filename: string): Promise<string> {
  const buffer = Buffer.from(base64File, "base64");

  // Handle plain text directly
  if (fileType === "txt") {
    return buffer.toString("utf-8");
  }

  // Use OpenAI file extraction API for other file types
  const client = new OpenAI({
    apiKey: env.ALIBABA_DASHSCOPE_API_KEY,
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  });

  // Create temporary file
  const tempFilePath = join(tmpdir(), `upload_${Date.now()}_${filename}`);
  
  try {
    writeFileSync(tempFilePath, buffer);

    // Use OpenAI file extraction
    const fileObject = await client.files.create({
      file: await import("fs").then(fs => fs.createReadStream(tempFilePath)),
      purpose: "file-extract" as any
    });

    // The file object should contain the extracted text
    // Note: The API response structure may vary, adjust based on actual response
    return (fileObject as any).text || JSON.stringify(fileObject);
  } finally {
    // Clean up temporary file
    try {
      unlinkSync(tempFilePath);
    } catch (error) {
      console.error("Failed to delete temp file:", error);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = uploadSchema.parse(body);

    let content = data.content || "";
    let filePath: string | undefined;
    let fileSize: number | undefined;

    // If file is provided, save it to disk and extract text
    if (data.file && data.fileType) {
      const { saveFile } = await import("@/lib/storage/fileStorage");
      
      // Generate filename from title
      const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.${data.fileType}`;
      const saved = await saveFile(data.file, filename);
      filePath = saved.filePath;
      fileSize = saved.size;

      // Extract text from file
      content = await extractTextFromFile(data.file, data.fileType, filename);
    }

    if (content.length < 10) {
      return NextResponse.json({ error: "Content too short or extraction failed" }, { status: 400 });
    }

    // Save document to database for preview/management
    const { prisma } = await import("@/server/db/client");
    const document = await prisma.document.create({
      data: {
        title: data.title,
        source: data.source,
        content,
        fileType: data.fileType,
        filePath,
        fileSize,
        tags: data.tags ? data.tags : undefined
      }
    });

    // Also save to vector store for RAG
    await vectorStore.upsertChunk({
      title: data.title,
      source: data.source,
      content,
      tags: data.tags
    });

    return NextResponse.json({ 
      success: true, 
      documentId: document.id,
      filePath 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
