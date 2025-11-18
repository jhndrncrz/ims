import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/server/db/client";

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        source: true,
        content: true,
        fileType: true,
        tags: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents", documents: [] }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Document ID required" }, { status: 400 });
  }

  try {
    // Get document to find file path
    const document = await prisma.document.findUnique({ where: { id } });
    
    if (document?.filePath) {
      const { deleteFile } = await import("@/lib/storage/fileStorage");
      await deleteFile(document.filePath);
    }

    // Delete from database
    await prisma.document.delete({ where: { id } });
    
    // Also delete associated chunks from vector store
    await prisma.documentChunk.deleteMany({ 
      where: { source: document?.source } 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
