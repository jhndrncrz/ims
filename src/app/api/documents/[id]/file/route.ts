import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      select: { filePath: true, fileType: true, title: true }
    });

    if (!document || !document.filePath) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fullPath = join(process.cwd(), document.filePath);
    
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    const fileBuffer = readFileSync(fullPath);
    
    // Extract actual filename from filePath
    const filename = document.filePath.split("/").pop() || "download";
    
    // Determine content type
    let contentType = "application/octet-stream";
    switch (document.fileType) {
      case "pdf":
        contentType = "application/pdf";
        break;
      case "docx":
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      case "txt":
        contentType = "text/plain";
        break;
      case "image":
        // Detect image type from file extension
        const ext = document.filePath.split(".").pop()?.toLowerCase();
        if (ext === "png") contentType = "image/png";
        else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
        else if (ext === "gif") contentType = "image/gif";
        else contentType = "image/png";
        break;
    }

    // Check if download is requested via query param
    const url = new URL(_request.url);
    const download = url.searchParams.get("download");
    const disposition = download === "true" ? "attachment" : "inline";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000"
      }
    });
  } catch (error) {
    console.error("Failed to serve file:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
