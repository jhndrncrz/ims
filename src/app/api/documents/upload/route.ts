import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import { PDFParse } from "pdf-parse";

import { vectorStore } from "@/lib/rag/vector-store";

const uploadSchema = z.object({
  title: z.string().min(1),
  source: z.string().min(0).optional(),
  content: z.string().min(0).optional(),
  tags: z.array(z.string()).optional(),
  file: z.string().optional(), // base64 encoded file
  fileType: z.enum(["pdf", "docx", "txt", "image"]).optional()
});

/**
 * Extract text from various file types using dedicated TypeScript libraries
 * - PDF: pdf-parse
 * - DOCX: mammoth
 * - Images: tesseract.js (OCR)
 * - TXT: direct UTF-8 decoding
 */
async function extractTextFromFile(base64File: string, fileType: string): Promise<string> {
  const buffer = Buffer.from(base64File, "base64");

  try {
    switch (fileType) {
      case "txt":
        return buffer.toString("utf-8");

      case "pdf": {
        // Try text extraction first
        try {
          const { resolve } = await import("path");
          const workerPath = resolve(process.cwd(), 'node_modules/pdf-parse/dist/worker/pdf.worker.mjs');
          PDFParse.setWorker(workerPath);
          
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          await parser.destroy();
          
          // If text extraction yields substantial content, use it
          if (result.text && result.text.trim().length > 50) {
            console.log(`📄 PDF extracted: ${result.pages.length} pages, ${result.text.length} chars`);
            return result.text;
          }
          
          console.log("⚠️ PDF has minimal text, falling back to OCR...");
        } catch (textError) {
          console.log("⚠️ PDF text extraction failed, falling back to OCR:", textError);
        }
        
        // Fall back to OCR for image-based PDFs
        console.log("🖼️ Starting OCR on PDF pages...");
        const { data: { text } } = await Tesseract.recognize(
          buffer,
          'eng+chi_sim+chi_tra+fil',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`PDF OCR progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );
        
        if (!text || text.trim().length === 0) {
          throw new Error("PDF contains no recognizable text even after OCR");
        }
        
        console.log(`🔍 PDF OCR extracted: ${text.length} chars`);
        return text;
      }

      case "docx": {
        // Try text extraction first
        try {
          const result = await mammoth.extractRawText({ buffer });
          
          if (result.messages.length > 0) {
            console.warn("⚠️ DOCX extraction warnings:", result.messages);
          }
          
          // If text extraction yields substantial content, use it
          if (result.value && result.value.trim().length > 50) {
            console.log(`📝 DOCX extracted: ${result.value.length} chars`);
            return result.value;
          }
          
          console.log("⚠️ DOCX has minimal text, falling back to OCR...");
        } catch (textError) {
          console.log("⚠️ DOCX text extraction failed, falling back to OCR:", textError);
        }
        
        // Fall back to OCR for image-based or corrupted DOCX
        console.log("🖼️ Starting OCR on DOCX...");
        const { data: { text } } = await Tesseract.recognize(
          buffer,
          'eng+chi_sim+chi_tra+fil',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`DOCX OCR progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );
        
        if (!text || text.trim().length === 0) {
          throw new Error("DOCX contains no recognizable text even after OCR");
        }
        
        console.log(`🔍 DOCX OCR extracted: ${text.length} chars`);
        return text;
      }

      case "image": {
        // Use Tesseract.js for OCR on images
        console.log("🖼️ Starting OCR on image...");
        
        const { data: { text } } = await Tesseract.recognize(
          buffer,
          'eng+chi_sim+chi_tra+fil', // English + Chinese Simplified + Traditional + Filipino
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );
        
        if (!text || text.trim().length === 0) {
          throw new Error("Image contains no recognizable text");
        }
        
        console.log(`🔍 OCR extracted: ${text.length} chars`);
        return text;
      }

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error(`❌ Text extraction failed for ${fileType}:`, error);
    throw new Error(`Failed to extract text from ${fileType}: ${error instanceof Error ? error.message : String(error)}`);
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
        source: data.source ?? "",
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
      source: data.source ?? "",
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
