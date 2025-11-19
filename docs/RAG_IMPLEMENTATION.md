# RAG (Retrieval-Augmented Generation) Implementation

## Overview

This system implements a complete RAG pipeline with:
- **Real vector embeddings** using Alibaba Cloud DashScope (with TF-IDF fallback)
- **File storage** on disk with database tracking
- **Text chunking** for optimal embedding quality
- **Similarity search** using cosine similarity
- **Document preview** capability
- **Multi-format support** (PDF, DOCX, TXT, Images via OCR)

## Architecture

```
┌─────────────────┐
│  User Uploads   │
│   Document      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Document Upload API                    │
│  - Saves file to disk (uploads/)        │
│  - Extracts text (PDF/DOCX/OCR)         │
│  - Stores in Document table             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Vector Store (vectorStore.upsertChunk) │
│  - Chunks text into 500-char segments   │
│  - Generates embeddings per chunk       │
│  - Stores in DocumentChunk table        │
└─────────────────────────────────────────┘

         ┌─────────────┐
         │   Query     │
         └─────┬───────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Similarity Search                      │
│  - Embed query text                     │
│  - Compare with all chunks              │
│  - Return top-k matches                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  RAG Engine                             │
│  - Constructs context from chunks       │
│  - Sends to LLM with question           │
│  - Returns answer + references          │
└─────────────────────────────────────────┘
```

## Database Schema

### Document Table (for preview/management)
```prisma
model Document {
  id          String   @id @default(cuid())
  title       String
  source      String
  content     String   // Full text content
  fileType    String?  // pdf, docx, txt, image
  filePath    String?  // Path to saved file
  fileSize    Int?     // File size in bytes
  tags        Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### DocumentChunk Table (for vector search)
```prisma
model DocumentChunk {
  id        String   @id @default(cuid())
  title     String
  source    String
  content   String   // Chunked text (~500 chars)
  embedding Json     // Vector embedding (768 or 1536 dims)
  tags      Json?
  createdAt DateTime @default(now())
}
```

## File Storage

Files are saved to the `uploads/` directory with the following structure:

```
uploads/
  ├── 1700000000000_document.pdf
  ├── 1700000001000_policy.docx
  └── 1700000002000_announcement.txt
```

**File naming:** `{timestamp}_{sanitized_filename}.{ext}`

## Embedding System

### Primary: Alibaba Cloud DashScope
- Model: `text-embedding-v2`
- Dimensions: 1536
- Max input: 2048 characters
- API: `https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding`

### Fallback: TF-IDF
- Used when API key is missing or API fails
- Dimensions: 768 (for consistency)
- Token-based with hash distribution
- L2 normalized vectors

## Text Chunking

Documents are automatically split into chunks for better retrieval:

```typescript
// Default chunk size: 500 characters
// Strategy: Split on sentence boundaries
const chunks = chunkText(document.content, 500);
```

**Benefits:**
- More precise retrieval
- Better embedding quality
- Handles long documents
- Reduces token usage

## Similarity Search

Uses **cosine similarity** to find relevant chunks:

```typescript
similarity = (A · B) / (||A|| × ||B||)
```

**Process:**
1. Embed the query
2. Load all document chunks
3. Calculate similarity score for each
4. Sort by score (descending)
5. Return top-k results

## API Endpoints

### Upload Document
```bash
POST /api/documents/upload
Content-Type: application/json

{
  "title": "Barangay Ordinance 2024-01",
  "source": "ordinances",
  "file": "base64EncodedFileContent",
  "fileType": "pdf",
  "tags": ["ordinance", "2024"]
}
```

**Response:**
```json
{
  "success": true,
  "documentId": "cmi55n4010000sglgvwoeiua7",
  "filePath": "uploads/1700000000000_ordinance.pdf"
}
```

### List Documents
```bash
GET /api/documents
```

**Response:**
```json
{
  "documents": [
    {
      "id": "cmi55n4010000sglgvwoeiua7",
      "title": "Barangay Ordinance 2024-01",
      "source": "ordinances",
      "content": "Full text...",
      "fileType": "pdf",
      "filePath": "uploads/...",
      "fileSize": 45678,
      "tags": ["ordinance"],
      "createdAt": "2024-11-18T10:00:00.000Z"
    }
  ]
}
```

### Get Document
```bash
GET /api/documents/{id}
```

### Delete Document
```bash
DELETE /api/documents?id={id}
```

**Actions:**
- Deletes file from disk
- Removes from Document table
- Removes all chunks from DocumentChunk table

## RAG Query

```typescript
import { ragEngine } from "@/lib/rag/engine";

const result = await ragEngine.answer("What are the office hours?");

// Result:
{
  answer: "The barangay office is open Monday to Friday...",
  confidence: 0.87,
  references: [
    { title: "Office Hours", source: "office-hours.md" },
    { title: "Contact Information", source: "contact.md" }
  ]
}
```

## Ingestion Script

Populate the database with existing documents:

```bash
npx tsx scripts/ingest-docs.ts
```

**What it does:**
1. Reads all `.md` files from `data/docs/`
2. Creates Document records
3. Chunks and embeds each document
4. Saves to DocumentChunk table

## Configuration

Add to `.env`:

```bash
# Required for real embeddings (otherwise uses fallback)
ALIBABA_DASHSCOPE_API_KEY=sk-xxxxx

# RAG confidence threshold (0-1)
RAG_CONFIDENCE_FALLBACK=0.65
```

## File Support

| Format | Library | Extraction Method |
|--------|---------|-------------------|
| PDF | `pdf-parse` | Text extraction |
| DOCX | `mammoth` | Text extraction |
| TXT | Native | Direct read |
| Images | `enhancedOCR` | Alibaba OCR + Tesseract |

## Performance

**Embedding Generation:**
- Alibaba API: ~200-500ms per chunk
- Fallback TF-IDF: <10ms per chunk

**Similarity Search:**
- 100 chunks: ~50ms
- 1000 chunks: ~200ms
- 10000 chunks: ~2s

**Recommendations:**
- Use Alibaba embeddings for production
- Consider pgvector for >10k documents
- Cache embeddings when possible

## Testing RAG

1. **Upload a test document:**
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document",
    "source": "test",
    "content": "This is a test document about barangay services."
  }'
```

2. **Query the RAG system:**
```bash
# Via SMS webhook
curl -X POST http://localhost:3000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "PhoneNumber": "+639123456789",
    "Content": "What services are available?"
  }'
```

3. **Check similarity search directly:**
```typescript
import { vectorStore } from "@/lib/rag/vector-store";

const results = await vectorStore.similaritySearch("barangay services", 5);
console.log(results.map(r => ({ 
  title: r.chunk.title, 
  score: r.score 
})));
```

## Troubleshooting

### No results from similarity search
- Check if documents are ingested: `SELECT COUNT(*) FROM DocumentChunk`
- Verify embeddings are stored: Check `embedding` field is not null
- Test with lower confidence threshold

### DashScope API errors
- Verify API key in `.env`
- Check API quota/limits
- System will fallback to TF-IDF automatically

### File upload fails
- Ensure `uploads/` directory has write permissions
- Check file size limits
- Verify file format is supported

## Future Improvements

1. **Vector Database Integration**
   - Migrate to pgvector or Pinecone
   - Enable approximate nearest neighbor search
   - Support millions of documents

2. **Hybrid Search**
   - Combine vector similarity with keyword matching
   - Add BM25 ranking

3. **Caching Layer**
   - Cache frequently accessed embeddings
   - Redis for query results

4. **Advanced Chunking**
   - Semantic chunking (split on topics)
   - Overlapping chunks
   - Hierarchical chunking

5. **Re-ranking**
   - Secondary model to reorder results
   - Cross-encoder for better relevance
