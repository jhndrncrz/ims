import fs from "node:fs";
import path from "node:path";

import { prisma } from "@/server/db/client";
import { vectorStore } from "@/lib/rag/vector-store";

const DOCS_DIR = path.join(process.cwd(), "data", "docs");

async function ingest() {
  console.log("🚀 Starting document ingestion...");
  console.log(`📂 Reading from: ${DOCS_DIR}`);

  const files = fs.readdirSync(DOCS_DIR);
  let processed = 0;

  for (const file of files) {
    const fullPath = path.join(DOCS_DIR, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile() || !file.endsWith(".md")) continue;

    console.log(`\n📄 Processing: ${file}`);
    const content = fs.readFileSync(fullPath, "utf-8");
    const title = file.replace(/\.md$/, "");

    // Save to Document table for preview
    const document = await prisma.document.create({
      data: {
        title,
        source: file,
        content,
        fileType: "txt",
        filePath: path.join("data", "docs", file),
        fileSize: stat.size,
        tags: ["barangay", "official"]
      }
    });

    console.log(`✅ Saved to database: ${document.id}`);

    // Save to vector store for RAG (will be chunked automatically)
    await vectorStore.upsertChunk({
      title,
      source: file,
      content,
      tags: ["barangay", "official"]
    });

    console.log(`✅ Embedded in vector store`);
    processed++;
  }

  console.log(`\n🎉 Ingestion complete! Processed ${processed} documents.`);
  await prisma.$disconnect();
}

ingest().catch((error) => {
  console.error("❌ Failed to ingest docs", error);
  process.exit(1);
});
