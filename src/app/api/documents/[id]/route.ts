import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: document.id,
      title: document.title,
      source: document.source,
      content: document.content,
      fileType: document.fileType,
      filePath: document.filePath,
      fileSize: document.fileSize,
      tags: document.tags,
      createdAt: document.createdAt.toISOString()
    });
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
