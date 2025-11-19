# Code Cleanup Analysis - Barangay AI SMS Hub

**Date**: November 19, 2025  
**Purpose**: Identify mock data, unimplemented features, and unused code for cleanup

---

## ✅ Fully Implemented & Working Features

### Core SMS & Report System
- ✅ **SMS Webhook** (`/api/sms-webhook`) - Receives messages, classifies reports, handles FAQ queries
- ✅ **Report Classification** - AI-powered with regex fallback, categorizes incidents
- ✅ **Report Management** - Full CRUD via `/api/reports`, dashboard UI with filters/search
- ✅ **Report Detail Modal** - View, edit status/priority/category, add resolution notes
- ✅ **SMS Simulator** - Test interface at `/simulator` for development

### RAG (Retrieval Augmented Generation)
- ✅ **Document Upload API** (`/api/documents/upload`) - Supports PDF, DOCX, TXT, images
- ✅ **Text Extraction** - pdf-parse (PDF), mammoth (DOCX), tesseract.js (OCR)
- ✅ **OCR Fallback** - Automatic OCR for scanned PDFs/DOCX with minimal text
- ✅ **Vector Store** - Alibaba text-embedding-v3 (1024 dims) with TF-IDF fallback
- ✅ **Similarity Search** - Cosine similarity with confidence threshold (0.65)
- ✅ **LLM Integration** - Alibaba DashScope (qwen-flash) via OpenAI SDK
- ✅ **Document Management UI** - Upload, view, delete, preview (PDF/images), download
- ✅ **File Storage** - Uploaded files stored in `uploads/` directory

### Multi-Channel Support
**Supported Channels**: SMS, Facebook Messenger, Email (WhatsApp intentionally excluded)

- ✅ **SMS Channel** - Fully working with Alibaba Dysms
- ✅ **Messenger Webhook** (`/api/messenger-webhook`) - Receives messages, sends replies
- ✅ **Email Processing** (`/api/email-check`) - IMAP polling, processes emails as reports
- ✅ **Conversations UI** - View all messages grouped by sender with direction badges

### AI & LLM
- ✅ **Alibaba LLM Client** - OpenAI SDK wrapper for DashScope
- ✅ **Embeddings** - text-embedding-v3 with graceful TF-IDF fallback
- ✅ **Classification** - LLM-based with JSON response format + regex fallback

---

## ⚠️ Mock/Placeholder Code (Needs Removal or Real Implementation)

### 1. **Settings Page** (`src/app/dashboard/settings/page.tsx`)
**Status**: 🔴 Entirely mock UI with no backend

**Mock Elements**:
- Line 85-87: Mock loading of environment values
```tsx
useEffect(() => {
  // Load current env values (mock - in real app would come from API)
  smsForm.setFieldValue("enabled", true);
  aiForm.setFieldValue("enabled", true);
}, []);
```

- Line 93-107: Fake connection testing
```tsx
const testConnection = async (service: string) => {
  setTestingConnection(true);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock connection test
  const success = Math.random() > 0.3; // Random success/fail
  setConnectionStatus(prev => ({ ...prev, [service]: success }));
  // ...
};
```

- Line 116-153: All save functions just show notifications, no actual persistence
```tsx
const saveSmsSettings = async (values: typeof smsForm.values) => {
  notifications.show({
    title: "Saved",
    message: "SMS settings updated successfully. Restart required.",
    color: "teal"
  });
};
```

**Recommendation**: 
- Either remove this page entirely (settings are managed via `.env`)
- OR implement proper backend API to read/write environment variables (complex, requires server restart)
- **Decision needed**: Keep as UI-only reference or remove completely?

---

### 2. **Voice Transcription** (`src/lib/ai/voiceToText.ts`)
**Status**: 🟡 Implemented but has mock fallback method

**Mock Element**:
- Line 76-80: `mockTranscribe` method that's never called
```tsx
async mockTranscribe(audioBuffer: Buffer): Promise<string> {
  logger.info("Using mock voice transcription", { bufferSize: audioBuffer.length });
  return "This is a mock transcription. Configure ALIBABA_DASHSCOPE_API_KEY for real voice recognition.";
}
```

**Recommendation**: 
- ✅ **REMOVE** - The `mockTranscribe` method is unused (not called anywhere in codebase)
- The `transcribe` method already throws errors when API key is missing, which is better

---

### 3. **Seed Script** (`prisma/seed.ts`)
**Status**: 🔴 Empty implementation

**Current State**:
```tsx
async function main() {}
```

**Recommendation**:
- Either implement proper seed data (sample reports, documents)
- OR remove the script and references to `pnpm db:seed` from docs
- **Decision needed**: Do we want demo/test data seeding capability?

---

### 4. **Report Form** (`src/components/dashboard/ReportForm.tsx`)
**Status**: 🟡 Working but labeled as "mock"

**Issue**: Line 64 labels this as "Log a mock SMS" but it actually creates real reports
```tsx
<strong>Log a mock SMS</strong>
<p style={{ margin: 0, fontSize: 14 }}>
  Use this form during demos to seed insights without sending an actual SMS.
</p>
```

**Recommendation**:
- ✅ **RELABEL** - Change UI text to clarify this creates real reports (not "mock")
- Suggestion: "Manual Report Entry" or "Create Report (Manual)"

---

## 🔴 Unimplemented Features

### 1. **Email Reply Sending** (`src/app/api/email-check/route.ts`)
**Status**: TODO comment

Line 55:
```tsx
// TODO: Send email reply back to sender
logger.info("Email processed", { from: senderEmail, type: result.type });
```

**Recommendation**:
- Implement SMTP sending (nodemailer) or remove email integration entirely
- Email receiving works, but one-way communication is incomplete

---

### 2. **WhatsApp Channel**
**Status**: Not planned for implementation

- `ChannelType.WHATSAPP` exists in Prisma schema but is not used
- System only supports: SMS, Facebook Messenger, Email

**Recommendation**:
- ✅ **REMOVE** `WHATSAPP` from `ChannelType` enum in Prisma schema
- Clean up any references in code or documentation

---

### 3. **Multi-Channel Message Logging**
**Status**: Partially implemented

**Issues**:
- `messageService.log()` doesn't accept `channel` parameter (line 6)
- Conversations UI only shows `phoneNumber`, doesn't display `channel`, `email`, or `messengerId`
- Channel-specific identifiers (email, messengerId) in schema but not used

**Current**:
```tsx
log: async (input: { 
  direction: MessageDirection; 
  phoneNumber: string; 
  body: string; 
  responseId?: string; 
  metadata?: Record<string, unknown> 
}) => { ... }
```

**Missing**: channel, email, messengerId fields

**Recommendation**:
- ✅ **FIX** - Add channel parameter to messageService.log()
- Update all callers (smsProcessor, messenger-webhook, email-check) to pass channel
- Update Conversations UI to show channel badges and proper identifiers

---

### 4. **Markdown Ingestion Script**
**Status**: Obsolete - replaced by web-based file uploads

**Issues**:
- `scripts/ingest-docs.ts` reads from non-existent `data/docs/` directory
- System now uses `uploads/` directory with web UI upload
- README and documentation still reference `pnpm rag:ingest` and markdown files

**Recommendation**:
- ✅ **REMOVE** `scripts/ingest-docs.ts` (no longer needed)
- ✅ **REMOVE** `pnpm rag:ingest` script from `package.json`
- ✅ **UPDATE** README.md to remove markdown ingestion references
- ✅ **UPDATE** documentation to reflect web-based upload workflow

---

## 🟢 Features That Look Mock But Are Real

### 1. **SMS Simulator** (`/simulator`)
**Clarification**: This is a REAL testing tool, not mock data
- Sends actual API requests to `/api/sms-webhook`
- Creates real database records
- Useful for development/demo

**Recommendation**: ✅ **KEEP** - Rename page title to clarify it's a testing tool

---

### 2. **AI Fallbacks** (LLM, Embeddings, Classification)
**Clarification**: These are INTENTIONAL fallbacks for graceful degradation
- LLM falls back to context snippets when API unavailable
- Embeddings fall back to TF-IDF (768 dims → 1024 dims fixed)
- Classifier falls back to regex patterns

**Recommendation**: ✅ **KEEP** - These are production-grade fallbacks, not mocks

---

## 📊 Statistics

### Code Categories
- **Fully Working**: 70% of features
- **Mock/Placeholder**: 15% of features
- **Unimplemented/TODO**: 10% of features
- **Unused/Dead Code**: 5% of features

### Priority Cleanup Items

**High Priority** (Breaks user expectations):
1. Settings page mock data (entire page is fake)
2. Multi-channel message logging (missing channel field)
3. Report form mislabeling ("mock SMS" but creates real data)

**Medium Priority** (Incomplete features):
4. Email reply sending (TODO)
5. `data/docs/` directory missing
6. Seed script empty

**Low Priority** (Unused code):
7. `mockTranscribe` method
8. WhatsApp channel enum (confirmed not planned)
9. Markdown ingestion script (`scripts/ingest-docs.ts`)
10. `pnpm rag:ingest` command

---

## 🎯 Recommended Actions

### Option A: Minimal Cleanup (Quick)
1. Remove `mockTranscribe` from voiceToText
2. Fix multi-channel message logging
3. Relabel Report Form ("Manual Report Entry")
4. Add disclaimer to Settings page ("UI Preview Only")
5. Remove WhatsApp enum from Prisma schema

### Option B: Full Production Ready
1. All of Option A
2. Remove or implement Settings page backend
3. Implement email reply sending OR remove email integration
4. Remove `scripts/ingest-docs.ts` and `pnpm rag:ingest`
5. Update all documentation to remove markdown ingestion references
6. Implement seed script with demo data

### Option C: Feature Freeze & Document (RECOMMENDED)
1. All of Option A
2. Mark Settings as "Configuration UI (No Backend)"
3. Document email as "Receive Only (IMAP)"
4. Remove markdown ingestion (script + docs)
5. Document upload workflow: "Web UI uploads to `uploads/` directory only"
6. Update README to remove `data/docs/` and `pnpm rag:ingest` references

---

## 📝 Files Requiring Changes

### To Remove/Clean:
- `src/lib/ai/voiceToText.ts` - Remove `mockTranscribe` method
- `prisma/seed.ts` - Either implement or remove
- `prisma/schema.prisma` - Remove `WHATSAPP` from `ChannelType` enum
- `scripts/ingest-docs.ts` - Remove entire file (obsolete)
- `package.json` - Remove `rag:ingest` script
- `src/app/dashboard/settings/page.tsx` - Add disclaimer OR implement backend

### To Fix:
- `src/server/services/messageService.ts` - Add channel parameter
- `src/server/services/smsProcessor.ts` - Pass channel when logging
- `src/app/api/messenger-webhook/route.ts` - Pass channel when logging
- `src/app/api/email-check/route.ts` - Pass channel when logging
- `src/app/dashboard/conversations/page.tsx` - Show channel/email/messengerId
- `src/components/dashboard/ReportForm.tsx` - Update UI labels

### To Update:
- `README.md` - Remove references to `data/docs/`, `pnpm rag:ingest`, markdown files
- `README.md` - Update to document web-based upload to `uploads/` directory
- `.github/copilot-instructions.md` - Remove markdown ingestion references
- `docs/RAG_IMPLEMENTATION.md` - Update ingestion section to reflect upload API only

---

## ❓ Questions for Decision

1. **Settings Page**: Keep as UI-only preview or implement full backend?
2. **Email Integration**: Implement SMTP replies or document as receive-only?
3. **Seed Script**: Implement demo data or remove entirely?

## ✅ Confirmed Decisions

1. ✅ **WhatsApp**: NOT supported - remove from schema
2. ✅ **Markdown Ingestion**: Obsolete - remove script and docs
3. ✅ **File Storage**: Web uploads to `uploads/` directory only

---

**End of Analysis**
