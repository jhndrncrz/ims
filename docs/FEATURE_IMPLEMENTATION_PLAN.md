# Feature Implementation Plan: AI-Enhanced Barangay SMS System

## Current State Analysis

### ✅ Already Implemented
1. **Basic Message Classification** (`src/lib/reporting/classifier.ts`)
   - Category classification (DISASTER, INFRASTRUCTURE, ADMIN, OTHER)
   - Priority assignment (HIGH, MEDIUM, LOW)
   - Confidence scoring
   - Fallback regex-based classification

2. **Report Processing** (`src/server/services/smsProcessor.ts`)
   - Report trigger detection
   - SMS/Messenger/Email multi-channel support
   - Message logging to database
   - RAG-based FAQ answering

3. **Database Schema** (`prisma/schema.prisma`)
   - Report model with category, priority, status
   - MessageLog for conversation tracking
   - Document/DocumentChunk for RAG

### ❌ Missing Features (To Implement)

## Phase 1: Enhanced Message Understanding & Field Extraction

**Goal**: Extract structured data from unstructured Filipino SMS messages

### 1.1 Create Enhanced Classifier (`src/lib/reporting/enhancedClassifier.ts`)

**New File**: Extract detailed fields from messages
```typescript
type ExtractedFields = {
  location?: string;
  time?: string;
  incidentType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  actionNeeded: string;
  entities: {
    people?: string[];
    places?: string[];
  };
}
```

**Implementation Steps**:
- [ ] Create new LLM prompt for field extraction
- [ ] Use Qwen-plus with structured JSON output
- [ ] Extract location (e.g., "near barangay hall")
- [ ] Extract time references (e.g., "kanina 3pm", "ngayon")
- [ ] Identify incident type from Filipino/English text
- [ ] Determine severity based on keywords
- [ ] Generate recommended action
- [ ] Add fallback NLP extraction using regex patterns

**LLM Prompt Template**:
```
Extract structured information from this Filipino barangay report:
- Location: Where did it happen?
- Time: When did it happen? (convert to timestamp)
- Incident Type: What happened?
- Severity: CRITICAL/HIGH/MEDIUM/LOW
- Action Needed: What should be done?
- People/Places mentioned
```

### 1.2 Update Database Schema

**File**: `prisma/schema.prisma`

Add new fields to `Report` model:
```prisma
model Report {
  // ... existing fields
  extractedLocation  String?
  extractedTime      String?
  incidentType       String?
  severity           String?
  actionNeeded       String?
  extractedEntities  Json?
  summaryGenerated   String?  // AI-generated summary
  sentiment          String?  // POSITIVE, NEUTRAL, NEGATIVE
  sentimentScore     Float?
}
```

**Steps**:
- [ ] Add new fields to schema
- [ ] Run `pnpm db:push` to update database
- [ ] Regenerate Prisma client
- [ ] Update TypeScript types

### 1.3 Update Report Service

**File**: `src/server/services/reportService.ts`

- [ ] Call enhanced classifier after basic classification
- [ ] Store extracted fields in database
- [ ] Generate AI summary on report creation

---

## Phase 2: SMS → Structured Report Generator

**Goal**: Pre-fill barangay report templates from SMS

### 2.1 Create Report Template Generator (`src/lib/reporting/templateGenerator.ts`)

**New File**: Generate structured reports

```typescript
type ReportTemplate = 
  | "INCIDENT_REPORT"
  | "BLOTTER_ENTRY"
  | "REQUEST_FOR_ASSISTANCE"
  | "EMERGENCY_NOTE";

generateTemplate(message: string, extractedFields: ExtractedFields, template: ReportTemplate)
  => FormattedReport
```

**Templates to Create**:
- Incident Report (for disasters, infrastructure issues)
- Blotter Entry (for peace & order issues)
- Request for Assistance (for help requests)
- Emergency Note (for critical incidents)

**Implementation**:
- [ ] Create template schemas (JSON)
- [ ] Use LLM to fill templates with extracted data
- [ ] Format output as PDF-ready HTML
- [ ] Add barangay logo and header
- [ ] Include timestamps, reference numbers

### 2.2 Create PDF Export Service (`src/lib/pdf/reportExporter.ts`)

**New Dependency**: Add `jspdf` or `puppeteer`

```bash
pnpm add jspdf jspdf-autotable
# OR
pnpm add puppeteer
```

**Implementation**:
- [ ] Create PDF generation utility
- [ ] Design report templates (HTML/CSS)
- [ ] Add QR code with report ID
- [ ] Include barangay seal/logo
- [ ] Generate filename: `REPORT_YYYYMMDD_ID.pdf`

### 2.3 Add Export API Route

**New File**: `src/app/api/reports/[id]/export/route.ts`

**Endpoints**:
- `GET /api/reports/[id]/export?format=pdf` - Download PDF
- `GET /api/reports/[id]/export?format=json` - Download JSON

**Implementation**:
- [ ] Fetch report with all fields
- [ ] Generate PDF using template
- [ ] Set proper headers (`Content-Disposition: attachment`)
- [ ] Return file stream

### 2.4 Update Report Detail Modal

**File**: `src/components/dashboard/ReportDetailModal.tsx`

**Add UI Elements**:
- [ ] "Export as PDF" button
- [ ] "Export as JSON" button
- [ ] Template type selector dropdown
- [ ] Preview generated report modal

---

## Phase 3: Recommended Actions & High-Priority Dashboard

**Goal**: AI-suggested actions and priority filtering

### 3.1 Create Recommendations Engine (`src/lib/reporting/recommendationsEngine.ts`)

**New File**: Generate action recommendations

```typescript
type Recommendation = {
  action: string;
  priority: number;
  assignedTo?: string;
  deadline?: string;
  resources?: string[];
}

getRecommendations(report: Report): Promise<Recommendation[]>
```

**LLM Prompt**:
```
Based on this barangay report, suggest 3 specific actions:
- What should be done immediately?
- Who should handle it? (Barangay Captain, Tanod, Social Worker, etc.)
- What resources are needed?
- What is the expected timeline?
```

**Implementation**:
- [ ] Call Qwen-plus with report details
- [ ] Parse structured recommendations
- [ ] Store in database (new `recommendations` field or table)
- [ ] Cache recommendations to avoid repeated API calls

### 3.2 Create High-Priority Dashboard Widget

**New Component**: `src/components/dashboard/HighPriorityReports.tsx`

**Features**:
- Shows only HIGH/CRITICAL priority reports
- Color-coded by severity
- Displays AI recommendations
- Quick action buttons
- Auto-refresh every 30 seconds

**Props**:
```typescript
type HighPriorityReportsProps = {
  reports: Report[];
  onReportClick: (id: string) => void;
  onTakeAction: (id: string, action: string) => void;
}
```

**UI Layout**:
```
┌─────────────────────────────────────┐
│ 🚨 HIGH PRIORITY REPORTS (3)       │
├─────────────────────────────────────┤
│ [CRITICAL] Flooding at Zone 3      │
│ 📍 Near barangay hall • 15 min ago │
│ 💡 Recommended: Deploy sandbags    │
│ [View] [Acknowledge] [Assign]      │
├─────────────────────────────────────┤
│ [HIGH] Streetlight broken          │
│ ...                                 │
└─────────────────────────────────────┘
```

**Implementation**:
- [ ] Create component with card layout
- [ ] Add severity badges (red for CRITICAL)
- [ ] Display recommendations chips
- [ ] Add quick action buttons
- [ ] Integrate with report store

### 3.3 Update Dashboard Page

**File**: `src/app/dashboard/page.tsx`

- [ ] Add `HighPriorityReports` component above charts
- [ ] Filter reports by priority >= HIGH
- [ ] Add "View All Reports" link
- [ ] Update metrics to show priority breakdown

---

## Phase 4: Conversation Summaries & Export

**Goal**: AI-generated conversation summaries with export

### 4.1 Create Conversation Summarizer (`src/lib/ai/conversationSummarizer.ts`)

**New File**: Generate conversation summaries

```typescript
type ConversationSummary = {
  phoneNumber: string;
  channel: string;
  messageCount: number;
  dateRange: { start: string; end: string };
  keyPoints: string[];
  extractedInfo: {
    location?: string;
    issue?: string;
    status?: string;
  };
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  summary: string; // Full paragraph summary
}

summarizeConversation(messages: Message[]): Promise<ConversationSummary>
```

**LLM Prompt**:
```
Summarize this SMS conversation between a citizen and barangay:

[Messages]

Provide:
1. Main issue/concern
2. Key information (location, time, people)
3. Current status
4. Next steps
5. Overall sentiment (positive/neutral/negative)
```

**Implementation**:
- [ ] Fetch all messages for a phone number
- [ ] Call Qwen-plus for summarization
- [ ] Cache summaries (regenerate when new messages)
- [ ] Store in database or return dynamically

### 4.2 Update Conversation Detail Component

**File**: `src/components/dashboard/ConversationDetail.tsx`

**Add Features**:
- [ ] "Generate Summary" button
- [ ] Display summary card at top
- [ ] Show extracted key info (badges)
- [ ] Sentiment indicator (emoji/color)
- [ ] "Export" dropdown menu

### 4.3 Create Conversation Export API

**New File**: `src/app/api/conversations/[phoneNumber]/export/route.ts`

**Endpoints**:
- `GET /api/conversations/[phoneNumber]/export?format=json`
- `GET /api/conversations/[phoneNumber]/export?format=pdf`

**JSON Export Format**:
```json
{
  "phoneNumber": "+639171234567",
  "channel": "SMS",
  "exportedAt": "2025-11-19T10:30:00Z",
  "summary": { ... },
  "messages": [ ... ],
  "analytics": {
    "totalMessages": 12,
    "responseTime": "5 minutes",
    "sentiment": "NEUTRAL"
  }
}
```

**PDF Export**:
- Conversation header (contact info, date range)
- Message thread (chronological)
- AI-generated summary section
- Key information extracted
- Barangay seal/watermark

**Implementation**:
- [ ] Create export route
- [ ] Add PDF template for conversations
- [ ] Include summary and analytics
- [ ] Add download button to UI

### 4.4 Add Export Buttons to UI

**File**: `src/components/dashboard/ConversationDetail.tsx`

**New Component**: `ConversationExportMenu.tsx`

```tsx
<Menu>
  <Menu.Item icon={<IconFileTypePdf />} onClick={exportPDF}>
    Export as PDF
  </Menu.Item>
  <Menu.Item icon={<IconFileTypeJson />} onClick={exportJSON}>
    Export as JSON
  </Menu.Item>
</Menu>
```

---

## Phase 5: Sentiment Analysis & Insights Dashboard

**Goal**: Analyze citizen sentiment and provide actionable insights

### 5.1 Create Sentiment Analyzer (`src/lib/ai/sentimentAnalyzer.ts`)

**New File**: Analyze message sentiment

```typescript
type SentimentResult = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  score: number; // -1 to 1
  confidence: number;
  keywords: string[];
  emotions?: string[]; // angry, frustrated, grateful, etc.
}

analyzeSentiment(message: string): Promise<SentimentResult>
```

**LLM Prompt**:
```
Analyze the sentiment of this Filipino message:

Message: "{message}"

Classify as POSITIVE, NEUTRAL, or NEGATIVE.
Score: -1 (very negative) to 1 (very positive)
Identify emotions: angry, frustrated, worried, grateful, satisfied
Extract key sentiment words
```

**Implementation**:
- [ ] Call Qwen-plus for sentiment analysis
- [ ] Support Filipino and English text
- [ ] Identify emotions (not just positive/negative)
- [ ] Store results in Report.sentiment fields

### 5.2 Batch Sentiment Analysis

**New API Route**: `src/app/api/reports/analyze-sentiment/route.ts`

**Endpoint**: `POST /api/reports/analyze-sentiment`

**Purpose**: Analyze sentiment for all reports (or date range)

**Implementation**:
- [ ] Fetch reports without sentiment analysis
- [ ] Batch process (10 at a time to avoid rate limits)
- [ ] Update database with results
- [ ] Return summary statistics

### 5.3 Create Insights Dashboard Component

**New Component**: `src/components/dashboard/SentimentInsights.tsx`

**Features**:
- Sentiment distribution chart (pie/donut)
- Trend over time (line chart)
- Top concerns by sentiment
- Emotion breakdown
- Actionable insights from Qwen

**Layout**:
```
┌────────────────────────────────────────────┐
│ 📊 Citizen Sentiment Analysis              │
├────────────────────────────────────────────┤
│ [Last 7 Days] [Last 30 Days] [All Time]   │
│                                            │
│ Sentiment Distribution:                    │
│ 😊 Positive: 45% ████████                 │
│ 😐 Neutral:  35% ██████                   │
│ 😟 Negative: 20% ████                     │
│                                            │
│ Top Concerns (Negative):                   │
│ 1. Flooding issues (12 reports)           │
│ 2. Streetlight problems (8 reports)       │
│                                            │
│ 💡 AI Insights:                            │
│ - Flooding complaints increased 30%       │
│ - Focus on Zone 3 drainage                │
│ - Citizens appreciate quick responses     │
└────────────────────────────────────────────┘
```

**Props**:
```typescript
type SentimentInsightsProps = {
  timeRange: "7d" | "30d" | "all";
  reports: Report[];
}
```

**Implementation**:
- [ ] Create component with Mantine charts
- [ ] Calculate sentiment statistics
- [ ] Generate AI insights using Qwen
- [ ] Add time range filter
- [ ] Export insights as PDF/JSON

### 5.4 Create Insights Generator (`src/lib/ai/insightsGenerator.ts`)

**New File**: Generate actionable insights

```typescript
type Insight = {
  category: string;
  finding: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  recommendation: string;
  affectedAreas?: string[];
  trendDirection?: "IMPROVING" | "STABLE" | "WORSENING";
}

generateInsights(reports: Report[]): Promise<Insight[]>
```

**LLM Prompt**:
```
Analyze these barangay reports and provide actionable insights:

[Reports data: categories, sentiments, locations, dates]

Identify:
1. Recurring issues or patterns
2. Areas needing attention
3. Sentiment trends over time
4. Positive developments
5. Specific recommendations for barangay officials

Format as structured insights with priority levels.
```

**Implementation**:
- [ ] Aggregate report data
- [ ] Call Qwen-plus for analysis
- [ ] Parse structured insights
- [ ] Cache results (regenerate daily)
- [ ] Display in dashboard

### 5.5 Add Sentiment to Dashboard Homepage

**File**: `src/app/dashboard/page.tsx`

- [ ] Add `SentimentInsights` component
- [ ] Place below metrics, above charts
- [ ] Add "View Full Analysis" link to dedicated page

### 5.6 Create Dedicated Insights Page

**New File**: `src/app/dashboard/insights/page.tsx`

**Features**:
- Full sentiment analysis dashboard
- Historical trends
- Detailed insights report
- Export options
- Filters by category, time, location

---

## Implementation Order & Dependencies

### Sprint 1 (Week 1): Core Enhancements
1. ✅ Enhanced message classifier with field extraction
2. ✅ Update database schema
3. ✅ Sentiment analysis integration
4. ✅ Batch sentiment processing

**Deliverables**: Smart message understanding working end-to-end

### Sprint 2 (Week 2): Report Templates & Export
1. ✅ Report template generator
2. ✅ PDF export service
3. ✅ Export API routes
4. ✅ UI export buttons

**Deliverables**: PDF/JSON export working for reports

### Sprint 3 (Week 3): Recommendations & Priority Dashboard
1. ✅ Recommendations engine
2. ✅ High-priority reports component
3. ✅ Update dashboard with priority widget
4. ✅ Action buttons and workflows

**Deliverables**: Priority dashboard with AI recommendations

### Sprint 4 (Week 4): Conversations & Insights
1. ✅ Conversation summarizer
2. ✅ Conversation export (PDF/JSON)
3. ✅ Sentiment insights dashboard
4. ✅ Insights generator

**Deliverables**: Full sentiment analysis and conversation summaries

---

## Technical Architecture

### New Directories Structure
```
src/
  lib/
    reporting/
      enhancedClassifier.ts     ← Field extraction
      templateGenerator.ts       ← Report templates
      recommendationsEngine.ts   ← AI recommendations
    ai/
      sentimentAnalyzer.ts      ← Sentiment analysis
      conversationSummarizer.ts ← Conversation summaries
      insightsGenerator.ts      ← Insights generation
    pdf/
      reportExporter.ts         ← PDF generation
      conversationExporter.ts   ← Conversation PDF
  components/
    dashboard/
      HighPriorityReports.tsx   ← Priority widget
      SentimentInsights.tsx     ← Sentiment dashboard
      ConversationExportMenu.tsx ← Export menu
      ReportTemplatePreview.tsx  ← Template preview
  app/
    api/
      reports/
        [id]/
          export/route.ts       ← Report export
        analyze-sentiment/route.ts ← Batch sentiment
      conversations/
        [phoneNumber]/
          export/route.ts       ← Conversation export
    dashboard/
      insights/page.tsx         ← Insights page
```

### Component Breakdown (Following Best Practices)

All new UI features will be broken into modular components:

1. **HighPriorityReports** → Sub-components:
   - `PriorityReportCard` (individual report)
   - `RecommendationChip` (action suggestions)
   - `QuickActionButtons` (acknowledge, assign, etc.)

2. **SentimentInsights** → Sub-components:
   - `SentimentChart` (pie/donut chart)
   - `SentimentTrend` (line chart over time)
   - `InsightCard` (individual insight display)
   - `EmotionBreakdown` (emotion analysis)

3. **ConversationSummary** → Sub-components:
   - `SummaryCard` (AI-generated summary)
   - `KeyInfoBadges` (extracted information)
   - `SentimentIndicator` (emoji + color)
   - `ExportMenu` (PDF/JSON options)

4. **ReportExport** → Sub-components:
   - `TemplateSelector` (choose report type)
   - `ExportPreview` (preview before download)
   - `ExportButton` (download trigger)

### API Design Principles

All new API routes will follow RESTful conventions:
- `GET /api/reports/[id]/export` - Export single report
- `POST /api/reports/analyze-sentiment` - Batch operation
- `GET /api/conversations/[phoneNumber]/export` - Export conversation
- `GET /api/insights` - Get aggregated insights

### Database Migration Strategy

1. Add new fields incrementally (no breaking changes)
2. Make all new fields optional (`?`)
3. Run migration: `pnpm db:push`
4. Regenerate client: `pnpm db:generate`
5. Update types in `@/types/report.ts`

### LLM Call Optimization

To avoid excessive API calls and costs:
1. **Cache results** - Store AI-generated summaries/insights
2. **Batch processing** - Analyze multiple reports together
3. **Incremental updates** - Only regenerate when new data arrives
4. **Fallback logic** - Use regex/rules when API unavailable
5. **Rate limiting** - Max 10 concurrent Qwen calls

---

## Testing Strategy

### Unit Tests
- [ ] Test field extraction with various Filipino messages
- [ ] Test sentiment analysis accuracy
- [ ] Test PDF generation
- [ ] Test template filling

### Integration Tests
- [ ] Test full report flow (SMS → Classification → Export)
- [ ] Test conversation summary generation
- [ ] Test batch sentiment analysis
- [ ] Test export APIs

### Manual Testing Scenarios
1. Send Filipino SMS with mixed Tagalog/English
2. Generate PDF report and verify formatting
3. Export conversation as JSON and PDF
4. Check sentiment analysis on positive/negative messages
5. Verify insights update when new reports arrive

---

## Success Metrics

### Feature Completion
- [ ] 100% of SMS messages get field extraction
- [ ] Reports can be exported as PDF in <2 seconds
- [ ] Conversations have AI summaries within 3 seconds
- [ ] Sentiment analysis runs on all reports
- [ ] Insights dashboard shows actionable recommendations

### Performance
- Field extraction: < 2s per message
- PDF generation: < 3s per report
- Conversation summary: < 5s for 50 messages
- Sentiment analysis: < 1s per message
- Insights generation: < 10s for 100 reports

### User Experience
- Export buttons visible and functional
- High-priority dashboard loads in < 1s
- Insights refresh daily automatically
- All AI features have fallback modes
- Error handling with user-friendly messages

---

## Risk Mitigation

### Risk: LLM API Failures
**Mitigation**: 
- Implement robust fallback logic (regex, rule-based)
- Cache all AI results
- Show cached data when API unavailable
- Retry failed requests (max 3 attempts)

### Risk: PDF Generation Performance
**Mitigation**:
- Generate PDFs asynchronously (background job)
- Cache generated PDFs for 24 hours
- Use efficient PDF library (jspdf vs puppeteer)
- Limit PDF generation to 1 per report per day

### Risk: Filipino Language Understanding
**Mitigation**:
- Fine-tune prompts with Filipino examples
- Test with real barangay messages
- Provide correction mechanism for misclassifications
- Allow manual override of AI classifications

### Risk: Database Performance with New Fields
**Mitigation**:
- Index new fields (location, sentiment)
- Use JSON fields sparingly
- Implement pagination for large queries
- Archive old reports after 1 year

---

## Next Steps

1. **Review Plan**: Validate with stakeholders
2. **Prioritize Features**: Confirm implementation order
3. **Setup Environment**: Install dependencies (jspdf, etc.)
4. **Create Tasks**: Break down into Jira/GitHub issues
5. **Begin Sprint 1**: Start with enhanced classifier

**Estimated Timeline**: 4 weeks (1 sprint per phase)
**Team Size**: 2 developers + 1 QA
**Dependencies**: Alibaba DashScope API access, PDF library

