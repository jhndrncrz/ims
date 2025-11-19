# Barangay AI SMS Hub - AI Agent Instructions

## Project Overview
Multi-channel Filipino barangay assistant that routes citizen messages through either:
1. **Report Classification Pipeline**: Detects incidents (broken streetlight, flood) → LLM classifier → Prisma storage → SMS acknowledgment
2. **RAG Question Answering Pipeline**: FAQ queries → Vector similarity search → Context retrieval → LLM generation → SMS reply

**Tech Stack**: Next.js 16 (App Router), Mantine UI v8, Prisma + SQLite, OpenAI SDK with Alibaba Cloud Model Studio, multi-channel support (SMS/Messenger/Email)

## Critical Architecture Patterns

### OpenAI SDK for All Alibaba Cloud AI Features
All AI integrations use the OpenAI SDK client with Alibaba's OpenAI-compatible endpoint:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: env.ALIBABA_DASHSCOPE_API_KEY,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

// Chat completions
const completion = await client.chat.completions.create({
  model: "qwen-plus",
  messages: [{ role: "system", content: PROMPT }, { role: "user", content: text }],
  temperature: 0.7,
  response_format: { type: "json_object" } // For classifier only
});

// Embeddings (text-embedding-v3)
const embedding = await client.embeddings.create({
  model: "text-embedding-v3",
  input: text.slice(0, 2048),
  encoding_format: "float"
});

// File extraction (documents/PDFs) - Two-step process
// Step 1: Upload file to get file-id
const fileObject = await client.files.create({
  file: createReadStream(tempFilePath),
  purpose: "file-extract" as any
});

// Step 2: Use qwen-long model to extract text via fileid://
const completion = await client.chat.completions.create({
  model: "qwen-long",
  messages: [
    { role: "system", content: "Extract text assistant prompt" },
    { role: "system", content: `fileid://${fileObject.id}` },
    { role: "user", content: "Extract all text from this document" }
  ]
});
```

**Never use raw fetch calls** for DashScope APIs. Always use OpenAI SDK. See `src/lib/ai/alibabaLLM.ts`, `src/lib/reporting/classifier.ts`, `src/lib/rag/embedding.ts`.

### Next.js 15+ Async Params (Breaking Change)
Dynamic route params are now `Promise<{ id: string }>` and must be awaited:

```typescript
// ✅ Correct (Next.js 15+)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Use id...
}

// ❌ Wrong (Next.js 14 pattern)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // Runtime error!
}
```

See `src/app/api/documents/[id]/route.ts` and `src/app/api/reports/[id]/route.ts` for examples.

### RAG Pipeline: Vector Store → Similarity Search → LLM
The RAG system uses two-step chunking + embedding:

1. **Document Upload** (`src/app/api/documents/upload/route.ts`):
   - Save file to `uploads/` directory via `fileStorage.saveFile()`
   - Extract text using OpenAI file extraction API
   - Create `Document` record (metadata)
   - Call `vectorStore.upsertChunk()` which:
     - Splits content into ~500 char chunks (sentence boundaries)
     - Generates embeddings for each chunk
     - Stores in `DocumentChunk` table with JSON-stringified embeddings

2. **Query Answering** (`src/lib/rag/engine.ts`):
   - Embed query text → Cosine similarity against all chunks
   - Retrieve top 4 chunks → Check confidence threshold (0.65 default)
   - If low confidence: Return "Please check with the barangay hall"
   - If high confidence: Pass context to LLM → Generate answer

**Key Files**: `src/lib/rag/vector-store.ts` (chunking + similarity), `src/lib/rag/embedding.ts` (OpenAI embeddings), `src/lib/rag/engine.ts` (orchestration)

### Mantine UI Patterns

#### Badge-Styled Selects with Combobox
Use `Combobox` + `InputBase` for dropdown selects that render badges (not `Select` or `NativeSelect`):

```typescript
const categoryCombobox = useCombobox();

<Combobox
  store={categoryCombobox}
  onOptionSubmit={(val) => {
    form.setFieldValue("category", val);
    categoryCombobox.closeDropdown();
  }}
>
  <Combobox.Target>
    <InputBase
      component="button"
      rightSection={<Combobox.Chevron />}
    >
      <Badge color={categoryColors[form.values.category]} 
             leftSection={createElement(categoryIcons[form.values.category], { size: 12 })}>
        {form.values.category}
      </Badge>
    </InputBase>
  </Combobox.Target>
  <Combobox.Dropdown>
    <Combobox.Options>
      {categories.map(cat => (
        <Combobox.Option key={cat} value={cat}>
          <Badge color={categoryColors[cat]} leftSection={icon}>{cat}</Badge>
        </Combobox.Option>
      ))}
    </Combobox.Options>
  </Combobox.Dropdown>
</Combobox>
```

**Reference**: `src/components/dashboard/ReportDetailModal.tsx` (category/priority/status dropdowns with badges)

#### Form Arrays and TagsInput
For dynamic arrays (like tags), use `TagsInput` instead of text input:

```typescript
<TagsInput
  label="Tags (optional)"
  placeholder="Add tags"
  {...form.getInputProps("tags")}
/>
```

Schema: `z.array(z.string())` (not `z.string()` with JSON.parse). See `src/app/dashboard/documents/page.tsx`.

## Essential Commands

```bash
# Development
pnpm dev                    # Start Next.js (port 3000)
pnpm build && pnpm start    # Production build + serve

# Database
pnpm db:push               # Sync Prisma schema to SQLite (no migration)
pnpm db:migrate            # Create named migration
pnpm db:generate           # Regenerate Prisma client after schema changes
pnpm db:seed               # Seed demo data

# RAG Knowledge Base
pnpm rag:ingest            # Chunk + embed all files in data/docs/
                           # Run after editing markdown docs
```

**Important**: Always run `pnpm db:generate` after modifying `prisma/schema.prisma` before using new fields.

## Data Flow Patterns

### SMS Webhook Flow (`POST /api/sms-webhook`)
```
Alibaba SMS → smsProcessor.handleIncoming() → Regex check (report trigger?)
  ├─ Report: classifyReport() → reportService.create() → smsClient.send(ack)
  └─ FAQ: ragEngine.answer() → vectorStore.similaritySearch() → alibabaLLM.ask() → smsClient.send(answer)
```

All messages logged to `MessageLog` table (INBOUND/OUTBOUND with metadata).

### Report Classification with Fallback
`src/lib/reporting/classifier.ts` uses two-tier approach:
1. **LLM Classification** (primary): OpenAI chat completions with `response_format: { type: "json_object" }` → Structured JSON
2. **Regex Fallback**: Pattern matching for Filipino/English keywords when API key missing or error

Always validate LLM responses against enum values before using.

## Multi-Channel Support

The system supports 4 channels (`ChannelType` enum): `SMS`, `MESSENGER`, `EMAIL`, `WHATSAPP`

- **SMS**: Primary channel, uses `@alicloud/pop-core` for Alibaba Dysms API
- **Messenger**: Webhook at `/api/messenger-webhook/route.ts`, requires `MESSENGER_PAGE_ACCESS_TOKEN`
- **Email**: IMAP receiver in `src/lib/email/receiver.ts`, polling-based

When creating reports or messages, always specify `channel` field. Default to `SMS` if unspecified.

## Environment Variables (src/env.ts)

All env vars validated with Zod schema at runtime:
- `ALIBABA_DASHSCOPE_API_KEY`: Required for LLM/embeddings/classifier (graceful fallbacks exist)
- `ALIBABA_SMS_*`: SMS sending (safe to skip in local dev, just logs)
- `RAG_CONFIDENCE_FALLBACK`: Minimum similarity score (default 0.65)
- `MESSENGER_*`: Facebook Messenger integration
- `DATABASE_URL`: SQLite by default, swap to PostgreSQL for production

**No `.env.example` exists** - check `src/env.ts` for the source of truth.

## Common Pitfalls

1. **Embedding Dimension Mismatch**: `text-embedding-v3` returns variable dimensions. Fallback TF-IDF uses 768 dims. `cosineSimilarity()` checks length but logs warning.

2. **JSON Serialization of Embeddings**: Prisma stores embeddings as `Json` type. Always `JSON.stringify()` before insert, `JSON.parse()` on read. See `vectorStore.upsertChunk()` and `parseEmbedding()`.

3. **Badge Nesting in Mantine**: Cannot nest `<Badge>` in `<Text>` (hydration error). Use `<Group>` instead:
   ```tsx
   // ❌ Wrong
   <Text><Badge>{value}</Badge></Text>
   
   // ✅ Correct
   <Group><Text>Label:</Text><Badge>{value}</Badge></Group>
   ```

4. **File Upload Cleanup**: OpenAI file extraction requires temp files. Always `unlinkSync()` in finally block. See `src/app/api/documents/upload/route.ts`.

5. **Prisma Client Regeneration**: After schema changes, TypeScript won't recognize new fields until `pnpm db:generate` runs. Error messages like "Property 'xyz' does not exist" usually indicate missing regeneration.

## Testing Locally Without API Keys

All AI features have **graceful fallbacks**:
- **LLM**: Returns context snippet fallback
- **Classifier**: Regex-based keyword matching
- **Embeddings**: TF-IDF vectors (768 dims)
- **SMS**: Logs to console instead of sending

Set `NODE_ENV=development` to see fallback logs.

## Key Files Reference

- **Entry Points**: `src/app/api/sms-webhook/route.ts`, `src/app/api/messenger-webhook/route.ts`
- **Business Logic**: `src/server/services/smsProcessor.ts`, `src/server/services/reportService.ts`
- **RAG System**: `src/lib/rag/{engine.ts,vector-store.ts,embedding.ts}`
- **AI Integration**: `src/lib/ai/alibabaLLM.ts`, `src/lib/reporting/classifier.ts`
- **UI Components**: `src/components/dashboard/ReportDetailModal.tsx` (Combobox patterns)
- **Database Schema**: `prisma/schema.prisma` (4 models: Report, Document, DocumentChunk, MessageLog)
