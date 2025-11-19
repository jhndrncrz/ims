# Frontend Integration Guide - Enhanced Fields & Sentiment Analysis

## Overview
This document describes how the Phase 1 enhanced field extraction and sentiment analysis are now integrated into the frontend UI.

## 🎯 Features Implemented

### 1. Individual Message Field Extraction (Conversations View)

**Location**: `/dashboard/conversations`

**What's Visible**:
- Each inbound message that triggered a report now has a **collapsible AI information panel**
- Click the chevron icon (↓/↑) next to messages with extracted data to reveal:
  - **Summary**: AI-generated English summary
  - **Location**: Extracted location ("Not specified" if unavailable)
  - **Time**: Extracted/converted time ("Not specified" if unavailable)
  - **Incident Type**: Categorized incident (e.g., "Flooding", "Streetlight issue")
  - **Severity**: Color-coded badge (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=green)
  - **Recommended Action**: Specific action for barangay officials
  - **Message Sentiment**: Individual message sentiment with confidence score

**UI Components**:
- Purple info icon indicator when AI data is available
- Collapsible section to avoid cluttering the conversation view
- Color-coded severity and sentiment badges
- Hover tooltips for additional context

**How It Works**:
1. When a report is created via SMS, the `reportId` is stored in `MessageLog.metadata`
2. The `/api/conversations` endpoint joins `MessageLog` with `Report` using this ID
3. Frontend receives `enhancedFields` for each message
4. `MessageWithEnhancedFields` component renders collapsible panel with data

---

### 2. Overall Conversation Sentiment Analysis

**Location**: `/dashboard/conversations` - Top of conversation detail panel

**What's Visible**:
- **Sentiment Badge**: Shows overall conversation tone (POSITIVE/NEUTRAL/NEGATIVE)
- **Color Coding**:
  - POSITIVE → Teal badge
  - NEUTRAL → Gray badge
  - NEGATIVE → Red badge
- **Confidence Score**: Tooltip shows confidence percentage
- Positioned next to channel badge in header

**How It Works**:
1. Backend aggregates all INBOUND messages in the conversation
2. Runs sentiment analysis on combined text
3. Returns `conversationSentiment` with sentiment type, score, and keywords
4. Frontend displays badge with dot variant in conversation header

**Use Cases**:
- Quickly identify frustrated citizens (NEGATIVE sentiment)
- Prioritize responses to distressed conversations
- Track satisfaction levels over time

---

### 3. Report Detail Modal Enhancements

**Location**: `/dashboard/reports` - Click any report to open detail modal

**What's Visible**:
Two new sections below the basic report information:

#### AI-Extracted Information Section
- **Summary**: Concise English summary of the report
- **Location & Time**: Side-by-side fields
- **Incident Type & Severity**: Color-coded severity badge
- **Recommended Action**: Actionable guidance for barangay

#### Sentiment Analysis Section
- **Sentiment Badge**: Color-coded sentiment type
- **Confidence Score**: Percentage
- **Keywords**: Array of emotion keywords as chips/badges

**Fallback Handling**:
- Shows "Not specified" for null/empty fields
- Entire section hidden if no enhanced data available
- Graceful degradation for legacy reports

---

## 🔧 Technical Implementation

### Backend Changes

#### 1. `/api/conversations` Route Enhancement
```typescript
// Now includes:
- enhancedFields for each message (joined from Report model)
- conversationSentiment for entire conversation
```

#### 2. `messageService.getConversations()` Enhancement
```typescript
// New logic:
1. Fetch all MessageLog entries
2. Extract reportId from metadata
3. Join with Report model to get enhanced fields
4. Aggregate inbound messages and run sentiment analysis
5. Return conversation with:
   - messages (with enhancedFields)
   - conversationSentiment
```

### Frontend Changes

#### 1. `ConversationDetail.tsx`
- New `MessageWithEnhancedFields` component
- Uses `useDisclosure` hook for collapse state
- Renders AI data in collapsible panel
- Shows conversation sentiment in header

#### 2. `conversations/page.tsx`
- Updated type definitions for `EnhancedFields`
- Added `ConversationSentiment` type
- Passes `conversationSentiment` to `ConversationDetail`

#### 3. `ReportDetailModal.tsx`
- Two new sections for AI data
- Conditional rendering based on field availability
- Color-coded badges for severity and sentiment

---

## 📊 Data Flow Diagram

```
SMS Received
    ↓
smsProcessor.handleIncoming()
    ↓
reportService.createWithEnhancement()
    ↓
┌─────────────────────────────────────┐
│ Parallel Execution:                 │
│  - extractFields() → Enhanced data  │
│  - analyzeSentiment() → Sentiment   │
└─────────────────────────────────────┘
    ↓
Create Report with all fields
    ↓
Store reportId in MessageLog.metadata
    ↓
─────────────────────────────────────
FRONTEND RETRIEVAL
─────────────────────────────────────
    ↓
/api/conversations
    ↓
Join MessageLog ↔ Report (via metadata.reportId)
    ↓
Aggregate inbound messages → analyzeSentiment()
    ↓
Return:
  - messages[] with enhancedFields
  - conversationSentiment
    ↓
UI renders collapsible panels + header badge
```

---

## 🎨 UI/UX Decisions

### Why Collapsible Panels?
- **Reduces visual clutter** in conversation view
- **On-demand information** - users expand when needed
- **Clear indicator** (chevron icon) that more info exists
- **Maintains conversation flow** readability

### Why Conversation-Level Sentiment?
- **Quick triage** for barangay staff
- **Prioritize urgent/negative** conversations
- **Overall tone** more useful than per-message sentiment for this use case
- **Non-intrusive** - badge in header, doesn't disrupt conversation

### Color Coding Strategy
**Severity**:
- 🔴 CRITICAL → Red (immediate action)
- 🟠 HIGH → Orange (urgent)
- 🟡 MEDIUM → Yellow (moderate priority)
- 🟢 LOW → Green (non-urgent)

**Sentiment**:
- 🟢 POSITIVE → Teal (satisfaction)
- ⚪ NEUTRAL → Gray (factual)
- 🔴 NEGATIVE → Red (frustration/distress)

---

## 🧪 Testing the Integration

### Test Scenario 1: Report with Full Extraction
1. Go to `/simulator`
2. Send: "May baha banda sa amin near barangay hall kanina 3pm"
3. Navigate to `/dashboard/conversations`
4. Click the conversation
5. **Expected**:
   - Purple chevron icon visible on inbound message
   - Click to expand → See location, time, incident type, severity, action
   - Conversation header shows sentiment badge

### Test Scenario 2: Message Without Extraction
1. Send: "Hello"
2. Check conversations
3. **Expected**:
   - No chevron icon (no enhanced data)
   - Message displays normally
   - No collapsible panel

### Test Scenario 3: Report Detail Modal
1. Go to `/dashboard/reports`
2. Click any report with enhanced data
3. **Expected**:
   - "AI-Extracted Information" section visible
   - "Sentiment Analysis" section visible
   - All fields populated or show "Not specified"

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Legacy Reports**: Old reports (before migration) have no enhanced fields
   - **Solution**: Fields are nullable, UI handles gracefully
   
2. **Non-Report Messages**: FAQ/inquiry responses don't have enhanced fields
   - **Solution**: Only inbound messages with `metadata.reportId` show extraction
   
3. **Sentiment Calculation Load**: Calculating conversation sentiment on every API call
   - **Future**: Cache sentiment or pre-calculate on message log

### Future Enhancements
- [ ] Persistent sentiment caching per conversation
- [ ] Sentiment trend visualization over time
- [ ] Batch sentiment recalculation for existing conversations
- [ ] Export conversation summaries with AI insights
- [ ] Keyword-based conversation search using extracted data

---

## 📝 Example API Response

```json
{
  "conversations": [
    {
      "phoneNumber": "09171234567",
      "messageCount": 3,
      "lastMessage": { ... },
      "messages": [
        {
          "id": "msg123",
          "direction": "INBOUND",
          "body": "May baha banda sa amin...",
          "createdAt": "2025-11-19T...",
          "enhancedFields": {
            "extractedLocation": "Near barangay hall",
            "extractedTime": "Today, 3:00 PM",
            "incidentType": "Flooding",
            "severity": "HIGH",
            "actionNeeded": "Deploy sandbags...",
            "summaryGenerated": "Flooding reported near...",
            "sentiment": "NEUTRAL",
            "sentimentScore": 0.85,
            "sentimentKeywords": ["baha", "report"]
          }
        }
      ],
      "conversationSentiment": {
        "sentiment": "NEUTRAL",
        "score": 0.85,
        "keywords": ["baha", "help"]
      }
    }
  ]
}
```

---

## ✅ Verification Checklist

- [x] Enhanced fields visible in conversation detail (collapsible)
- [x] Conversation sentiment badge in header
- [x] Report detail modal shows AI sections
- [x] "Not specified" labels for missing fields
- [x] Color-coded severity badges
- [x] Color-coded sentiment badges
- [x] Tooltip shows sentiment confidence
- [x] Collapsible panel state persists per message
- [x] TypeScript types updated for all new fields
- [x] Backend joins MessageLog ↔ Report correctly
- [x] Sentiment analysis runs for conversations

---

**Last Updated**: November 19, 2025  
**Implementation Status**: ✅ Complete  
**Phase**: Phase 1 - Enhanced Message Understanding & Sentiment Analysis
