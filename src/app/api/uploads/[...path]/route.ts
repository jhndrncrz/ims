import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

/**
 * GET /api/uploads/[...path]
 * Serves uploaded files (logos, attachments, etc.)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: filePath } = await params;
    
    if (!filePath || filePath.length === 0) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Join the path segments
    const relativePath = filePath.join("/");
    const absolutePath = path.join(process.cwd(), "uploads", relativePath);

    // Security check: ensure the path is within uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!absolutePath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await fs.readFile(absolutePath);

    // Determine content type based on extension
    const ext = path.extname(absolutePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".txt": "text/plain"
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    logger.error("Failed to serve uploaded file", { error });
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
