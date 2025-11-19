import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";

import { vectorStore } from "@/lib/rag/vector-store";
import { logger } from "@/lib/logger";

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
          const { PDFParse } = await import("pdf-parse");
          const { resolve } = await import("path");
          const workerPath = resolve(process.cwd(), 'node_modules/pdf-parse/dist/worker/pdf.worker.mjs');
          PDFParse.setWorker(workerPath);
          
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          await parser.destroy();
          
          // If text extraction yields substantial content, use it
          if (result.text && result.text.trim().length > 50) {
            logger.info(`PDF extracted: ${result.pages.length} pages, ${result.text.length} chars`);
            return result.text;
          }
          
          logger.info("PDF has minimal text, falling back to OCR");
        } catch (textError) {
          logger.warn("PDF text extraction failed, falling back to OCR", { error: textError });
        }
        
        // Fall back to OCR for image-based PDFs - convert to images first
        logger.info("Converting PDF to images for OCR");
        
        // Dynamic imports for canvas and pdfjs-dist to avoid Node.js build issues
        const pdfjsLib = await import("pdfjs-dist");
        const { createCanvas } = await import("canvas");
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;
        logger.info(`PDF has ${numPages} pages`);
        
        const worker = await createWorker('eng');
        const allText: string[] = [];
        
        try {
          // Process each page
          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            logger.debug(`Processing PDF page ${pageNum}/${numPages}`);
            
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
            
            // Create canvas
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');
            
            // Render PDF page to canvas
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
              canvas: canvas
            };
            await page.render(renderContext as unknown as Parameters<typeof page.render>[0]).promise;
            
            // Convert canvas to buffer
            const imageBuffer = canvas.toBuffer('image/png');
            
            // Run OCR on the image
            const { data: { text } } = await worker.recognize(imageBuffer);
            
            if (text && text.trim().length > 0) {
              allText.push(text.trim());
              logger.debug(`Page ${pageNum} extracted ${text.trim().length} chars`);
            }
          }
          
          const combinedText = allText.join('\n\n');
          
          if (!combinedText || combinedText.trim().length === 0) {
            throw new Error("PDF contains no recognizable text even after OCR");
          }
          
          logger.info(`Total PDF OCR extracted: ${combinedText.length} chars from ${numPages} pages`);
          return combinedText;
        } finally {
          await worker.terminate();
        }
      }

      case "docx": {
        // Try text extraction first
        try {
          const result = await mammoth.extractRawText({ buffer });
          
          if (result.messages.length > 0) {
            logger.warn("DOCX extraction warnings", { messages: result.messages });
          }
          
          // If text extraction yields substantial content, use it
          if (result.value && result.value.trim().length > 50) {
            logger.info(`DOCX extracted: ${result.value.length} chars`);
            return result.value;
          }
          
          logger.info("DOCX has minimal text, falling back to OCR");
        } catch (textError) {
          logger.warn("DOCX text extraction failed, falling back to OCR", { error: textError });
        }
        
        // Fall back to OCR for image-based or corrupted DOCX
        logger.info("Starting OCR on DOCX");
        const worker = await createWorker('eng');
        try {
          const { data: { text } } = await worker.recognize(buffer);
          
          if (!text || text.trim().length === 0) {
            throw new Error("DOCX contains no recognizable text even after OCR");
          }
          
          logger.info(`DOCX OCR extracted: ${text.length} chars`);
          return text;
        } finally {
          await worker.terminate();
        }
      }

      case "image": {
        // Use Tesseract.js for OCR on images
        logger.info("Starting OCR on image");
        
        const worker = await createWorker('eng');
        try {
          const { data: { text } } = await worker.recognize(buffer);
          
          if (!text || text.trim().length === 0) {
            throw new Error("Image contains no recognizable text");
          }
          
          logger.info(`OCR extracted: ${text.length} chars`);
          return text;
        } finally {
          await worker.terminate();
        }
      }

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    logger.error(`Text extraction failed for ${fileType}`, { error });
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
    logger.error("Upload error", { error });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
