## Barangay AI SMS Hub (Hackathon MVP)

Unified SMS hotline for Filipino barangays that blends Alibaba Cloud SMS + LLM services with a lightweight RAG pipeline, Prisma data layer, and Mantine-powered dashboard.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Mantine UI v7, Mantine Forms, Zustand state management
- Prisma ORM + SQLite (swap to Alibaba Cloud RDS when ready)
- Custom TF–IDF vector store + Alibaba DashScope LLM
- Alibaba Cloud SMS (Dysms) integration for send/receive

## Project Structure

```
src/
  app/              # Next.js routes (dashboard + API)
  components/       # Mantine UI building blocks
  lib/              # Logger, formatters, RAG, SMS helpers
  server/           # Prisma client + domain services
  store/            # Zustand stores
  types/            # Shared DTOs
scripts/ingest-docs.ts   # CLI to chunk + embed docs
prisma/schema.prisma     # Database models
data/docs/               # Markdown knowledge base
```

## Setup

1. **Install dependencies**
	```bash
	pnpm install
	```
2. **Environment variables** – copy `.env.example` → `.env` and provide your keys:
	```
	DATABASE_URL="file:./dev.db"
	ALIBABA_SMS_ACCESS_KEY_ID=...
	ALIBABA_SMS_ACCESS_KEY_SECRET=...
	ALIBABA_SMS_SIGN_NAME=BarangayAI
	ALIBABA_SMS_TEMPLATE_CODE=SMS_123456789
	ALIBABA_DASHSCOPE_API_KEY=...
	```
3. **Database + seed + RAG ingestion**
	```bash
	pnpm db:push      # create tables
	pnpm db:seed      # optional demo records
	pnpm rag:ingest   # chunk markdown docs into vector store
	```
4. **Run locally**
	```bash
	pnpm dev
	```
	Visit `http://localhost:3000` for the Mantine dashboard.

## Core APIs

- `POST /api/sms-webhook` – receives Alibaba SMS callbacks (JSON or form-data). Auto-detects whether the SMS is a citizen report or an FAQ query, routes to the classifier + Prisma or to the RAG + DashScope pipeline, and issues an SMS reply.
- `/api/reports`
  - `GET` – returns stored reports for the dashboard table.
  - `POST` – dashboard form helper to seed mock SMS reports (uses same classifier and Prisma service).

## RAG Knowledge Base

- Markdown files live in `data/docs` (`announcements.md`, `ordinances.md`, `disaster-guidelines.md`).
- Run `pnpm rag:ingest` after editing content to regenerate embeddings stored in the `DocumentChunk` table.
- Retrieval happens inside `src/lib/rag/engine.ts` with cosine similarity and a confidence gate. Low-confidence answers fall back to “Please check with the barangay hall.”

## SMS + AI Integrations

- `src/lib/sms/alibabaSms.ts` wraps Alibaba POP Core; if credentials are missing (local dev) it just logs the outbound SMS payload.
- `src/lib/ai/alibabaLLM.ts` sends prompts to DashScope (`qwen-plus`) and gracefully falls back to deterministic snippets when exceptions occur.

## Deployment (Alibaba Cloud)

1. **Hosting** – Deploy the Next.js server on Alibaba Cloud ECS, Serverless App Engine, or Function Compute (Node.js 20). Set environment variables through the console or KMS.
2. **Database** – Switch `DATABASE_URL` to an ApsaraDB RDS URI and update `provider` in `prisma/schema.prisma` before running `pnpm db:push`.
3. **Ingress** – Expose `/api/sms-webhook` publicly and configure the Alibaba SMS inbound webhook to call that URL.
4. **Secrets** – Store SMS + DashScope credentials inside Alibaba Cloud KMS or Secrets Manager, inject at runtime.
5. **Knowledge sync** – Run `pnpm rag:ingest` via CI/CD or a scheduled ECS task whenever `data/docs` changes.

## Helpful Commands

```bash
pnpm dev            # start Next.js + Mantine dashboard
pnpm build && pnpm start  # production build + serve
pnpm lint           # ESLint (type-safe checks)
pnpm db:push        # sync Prisma schema to DB
pnpm db:seed        # seed demo data
pnpm rag:ingest     # rebuild vector store embeddings
pnpm db:migrate     # create a named migration (local)
```

## Demo Flow

1. `POST /api/sms-webhook` with `{ "phoneNumber": "09171234567", "message": "Broken streetlight near barangay hall" }`.
2. Check the dashboard table for the new incident with automatic category + priority tagging.
3. Ask “What’s the curfew for minors?” to see RAG-backed answers powered solely by your ingested documents.

Happy hacking! 🎯
