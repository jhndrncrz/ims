## BarangaAI (Hackathon MVP)

Unified SMS hotline for Filipino barangays that blends Alibaba Cloud SMS + LLM services with a lightweight RAG pipeline, Prisma data layer, and Mantine-powered dashboard.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Mantine UI v8, Mantine Forms, Zustand state management
- Prisma ORM + SQLite (swap to Alibaba Cloud RDS when ready)
- Alibaba text-embedding-v3 (1024 dims) + DashScope LLM (qwen-flash)
- Multi-channel support: SMS (Dysms), Facebook Messenger, Email (IMAP)
- Document processing: pdf-parse, mammoth, tesseract.js (OCR)

## Project Structure

```
src/
  app/              # Next.js routes (dashboard + API)
  components/       # Mantine UI building blocks
  lib/              # Logger, formatters, RAG, SMS helpers
  server/           # Prisma client + domain services
  store/            # Zustand stores
  types/            # Shared DTOs
prisma/schema.prisma     # Database models
uploads/                 # User-uploaded documents (PDF, DOCX, images)
```

## Setup

1. **Install dependencies**
	```bash
	pnpm install
	```
2. **Environment variables** – check `src/env.ts` for all options:
	```bash
	# Required
	DATABASE_URL="file:./dev.db"
	ALIBABA_DASHSCOPE_API_KEY=sk-xxx  # DashScope LLM + embeddings
	
	# SMS (optional, logs to console if missing)
	ALIBABA_SMS_ACCESS_KEY_ID=...
	ALIBABA_SMS_ACCESS_KEY_SECRET=...
	ALIBABA_SMS_SIGN_NAME=BarangayAI
	ALIBABA_SMS_TEMPLATE_CODE=SMS_123456789
	
	# Multi-channel (optional)
	MESSENGER_PAGE_ACCESS_TOKEN=...  # Facebook Messenger
	MESSENGER_VERIFY_TOKEN=...
	MESSENGER_APP_SECRET=...
	```
3. **Database setup**
	```bash
	pnpm db:push      # create tables
	```
4. **Run locally**
	```bash
	pnpm dev
	```
	Visit `http://localhost:3000` for the Mantine dashboard.

## Core APIs

### Message Processing
- `POST /api/sms-webhook` – Alibaba SMS callbacks. Auto-classifies reports or answers FAQs via RAG
- `POST /api/messenger-webhook` – Facebook Messenger integration (verify & receive messages)
- `POST /api/email-check` – Manual trigger to poll IMAP inbox and process emails
- `POST /api/voice-message` – Voice-to-text transcription + processing (future feature)

### Reports & Documents
- `GET /api/reports` – List all reports with filters
- `POST /api/reports` – Create report manually (dashboard form)
- `GET /api/reports/[id]` – Get single report
- `PATCH /api/reports/[id]` – Update report (status, priority, resolution)
- `POST /api/documents/upload` – Upload PDF/DOCX/image, extract text, generate embeddings
- `GET /api/documents` – List all knowledge base documents
- `GET /api/documents/[id]/file` – Download or preview uploaded file

### Conversations
- `GET /api/conversations` – View all message threads grouped by sender

## RAG Knowledge Base

**Upload Workflow**:
1. Navigate to Dashboard → Documents (`/dashboard/documents`)
2. Click "Upload Document" and select PDF, DOCX, TXT, or image file
3. System automatically:
   - Extracts text (pdf-parse for PDF, mammoth for DOCX, tesseract.js OCR for images)
   - Falls back to OCR if text extraction yields <50 chars (scanned documents)
   - Chunks content into ~500 char segments
   - Generates 1024-dim embeddings via Alibaba text-embedding-v3
   - Stores in `DocumentChunk` table for similarity search

**Query Processing**:
- User asks question via SMS/Messenger/Email
- System embeds query → cosine similarity search → top 4 chunks
- If confidence > 0.65: LLM generates answer with context
- If confidence < 0.65: "Please check with the barangay hall" fallback

**Supported Formats**: PDF, DOCX, TXT, PNG, JPG, GIF

## AI Integrations

**Alibaba DashScope** (via OpenAI SDK):
- `text-embedding-v3` for 1024-dim semantic embeddings (TF-IDF fallback)
- `qwen-flash` for LLM chat completions (context fallback)
- JSON-structured classification with regex fallback

**Document Processing**:
- `pdf-parse` for text-based PDFs
- `mammoth` for DOCX files
- `tesseract.js` for OCR (scanned docs, images) - multi-language support

**Multi-Channel**:
- SMS: `@alicloud/pop-core` Dysms API (logs if credentials missing)
- Messenger: Facebook Graph API webhooks
- Email: `imap` library for polling (receive-only, send via dashboard)

## Deployment (Alibaba Cloud)

1. **Hosting** – Deploy on ECS, Serverless App Engine, or Function Compute (Node.js 20+)
2. **Database** – Switch `DATABASE_URL` to ApsaraDB RDS PostgreSQL URI, update `prisma/schema.prisma` provider
3. **Webhooks** – Expose publicly:
   - `/api/sms-webhook` → Configure in Alibaba SMS console
   - `/api/messenger-webhook` → Configure in Facebook Developer portal
4. **Secrets** – Store in Alibaba Cloud KMS: `ALIBABA_DASHSCOPE_API_KEY`, SMS credentials, Messenger tokens
5. **File Storage** – Mount persistent volume for `uploads/` directory or use OSS bucket
6. **Knowledge Base** – Admins upload documents via `/dashboard/documents` (no CLI required)

## Helpful Commands

```bash
pnpm dev            # Start Next.js dev server (port 3000)
pnpm build          # Production build
pnpm start          # Serve production build
pnpm lint           # ESLint type-safe checks
pnpm db:push        # Sync Prisma schema to database (no migration)
pnpm db:generate    # Regenerate Prisma client after schema changes
pnpm db:migrate     # Create named migration (use before production)
```

## Demo Flow

### 1. Upload Knowledge Base Document
- Go to `/dashboard/documents`
- Upload a PDF with barangay policies (e.g., curfew rules, office hours)
- System extracts text, chunks, and embeds automatically

### 2. Test SMS Report
- Go to `/simulator` or POST to `/api/sms-webhook`:
  ```json
  {
    "phoneNumber": "09171234567",
    "message": "Broken streetlight near barangay hall",
    "skipSmsReply": true
  }
  ```
- Check `/dashboard/reports` for auto-classified incident (category, priority)

### 3. Test RAG Query
- Send FAQ via simulator: "What is the curfew for minors?"
- System retrieves relevant chunks → LLM generates answer from uploaded docs
- View conversation thread in `/dashboard/conversations`

### 4. Multi-Channel Testing
- Configure Facebook Messenger webhook → Send messages via Messenger
- Configure email IMAP → POST to `/api/email-check` to process inbox

Happy hacking! 🎯
