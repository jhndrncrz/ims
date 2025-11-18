import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pdf from "pdf-parse";
import mammoth from "mammoth";

import { vectorStore } from "@/lib/rag/vector-store";
import { enhancedOCR } from "@/lib/ai/enhancedOCR";

const uploadSchema = z.object({
  title: z.string().min(1),
  source: z.string().min(1),
  content: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  file: z.string().optional(), // base64 encoded file
  fileType: z.enum(["pdf", "docx", "txt", "image"]).optional()
});

async function extractTextFromFile(base64File: string, fileType: string): Promise<string> {
  const buffer = Buffer.from(base64File, "base64");

  switch (fileType) {
    case "pdf": {
      const data = await pdf(buffer);
      return data.text;
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "txt":
      return buffer.toString("utf-8");
    case "image": {
      const text = await enhancedOCR.extract({
        imageBuffer: buffer,
        language: "multi",
        enhanced: true
      });
      return text;
    }
    default:
      throw new Error("Unsupported file type");
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
      content = await extractTextFromFile(data.file, data.fileType);
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
        tags: data.tags ? JSON.stringify(data.tags) : null
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
