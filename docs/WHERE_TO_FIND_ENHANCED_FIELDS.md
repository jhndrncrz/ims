# Where to Find Enhanced Fields - User Guide

## 🎯 Quick Answer

Enhanced fields are visible in **TWO places**:

1. **Reports Table** (`/dashboard/reports`) - Shows "Enhanced" badge + Severity/Sentiment columns
2. **Report Detail Modal** - Click "View" on any report to see all extracted fields
3. **Conversations View** (`/dashboard/conversations`) - Chevron icon on messages with extracted data

---

## 📍 Location 1: Reports Table

**Path**: `/dashboard/reports`

### What You'll See:

**NEW Columns Added**:
- **Severity** column - Shows CRITICAL/HIGH/MEDIUM/LOW with color coding
- **Sentiment** column - Shows POSITIVE/NEUTRAL/NEGATIVE
- **"Enhanced" badge** - Small purple badge under message text indicating AI extraction is available

**Visual Indicators**:
```
┌─────────────┬──────────────┬──────────┬──────────┬────────┬──────────┬───────────┬──────────┬─────────┐
│ Phone       │ Message      │ Category │ Priority │ Status │ Severity │ Sentiment │ Received │ Actions │
├─────────────┼──────────────┼──────────┼──────────┼────────┼──────────┼───────────┼──────────┼─────────┤
│ 09171234567 │ May baha...  │ DISASTER │ HIGH     │ OPEN   │ HIGH ⚠️  │ NEUTRAL 😐│ 3:45 PM  │ [View]  │
│             │ [Enhanced✨] │          │          │        │          │           │          │         │
└─────────────┴──────────────┴──────────┴──────────┴────────┴──────────┴───────────┴──────────┴─────────┘
```

**Color Coding**:
- **Severity**: CRITICAL (red) → HIGH (orange) → MEDIUM (yellow) → LOW (green)
- **Sentiment**: POSITIVE (teal) → NEUTRAL (gray) → NEGATIVE (red)
- **Enhanced badge**: Purple with sparkle icon ✨

---

## 📍 Location 2: Report Detail Modal (Full View)

**Path**: `/dashboard/reports` → Click "View" button on any report

### What You'll See:

When you click "View" on a report with enhanced fields, the modal shows:

#### **Section 1: Basic Information** (Top)
- Phone number
- Full message text
- AI response sent
- Category/Priority/Status badges
- Classification confidence
- Received timestamp

#### **Section 2: AI-Extracted Information** (Middle)
```
┌────────────────────────────────────────────────┐
│ AI-Extracted Information                       │
├────────────────────────────────────────────────┤
│ Summary                                        │
│ Flooding reported near barangay hall this      │
│ afternoon at 3 PM.                             │
│                                                │
│ Location          │ Time                       │
│ Near barangay hall│ Today, 3:00 PM            │
│                                                │
│ Incident Type     │ Severity                   │
│ Flooding          │ HIGH ⚠️                    │
│                                                │
│ Recommended Action                             │
│ Deploy sandbags and drainage crew to area     │
│ near barangay hall                             │
└────────────────────────────────────────────────┘
```

#### **Section 3: Sentiment Analysis** (Bottom)
```
┌────────────────────────────────────────────────┐
│ Sentiment Analysis                             │
├────────────────────────────────────────────────┤
│ Sentiment: NEUTRAL 😐  Confidence: 85%         │
│                                                │
│ Keywords: [baha] [report]                      │
└────────────────────────────────────────────────┘
```

**Fields Displayed**:
- ✅ AI-generated summary
- ✅ Extracted location ("Not specified" if unavailable)
- ✅ Extracted time ("Not specified" if unavailable)
- ✅ Incident type (categorized)
- ✅ Severity level (color-coded badge)
- ✅ Recommended action for barangay officials
- ✅ Sentiment classification
- ✅ Sentiment confidence score
- ✅ Emotion keywords detected

---

## 📍 Location 3: Conversations View (Individual Messages)

**Path**: `/dashboard/conversations`

### What You'll See:

**For messages linked to reports**:
```
┌────────────────────────────────────────────────────┐
│ INBOUND 🔽                           3:45 PM       │
├────────────────────────────────────────────────────┤
│ May baha banda sa amin near barangay hall         │
│ kanina 3pm                                         │
│                                                    │
│ [Click chevron to expand] ▼                        │
│                                                    │
│ ┌────────────────────────────────────────────┐    │
│ │ 🤖 AI-Extracted Information                │    │
│ │────────────────────────────────────────────│    │
│ │ Summary: Flooding reported near...         │    │
│ │ Location: Near barangay hall               │    │
│ │ Time: Today, 3:00 PM                       │    │
│ │ Incident Type: Flooding                    │    │
│ │ Severity: HIGH ⚠️                          │    │
│ │ Recommended Action: Deploy sandbags...     │    │
│ │ Sentiment: NEUTRAL 😐 (85%)                │    │
│ └────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

**Visual Indicators**:
- 🔽 Purple chevron icon appears next to messages with enhanced data
- Icon only shows for messages that have linked reports with extraction
- Click to expand/collapse the AI data panel

---

## 🧪 How to Test Right Now

### Option 1: Use SMS Simulator
1. Go to `/simulator`
2. Enter test message: `"May baha banda sa amin near barangay hall kanina 3pm"`
3. Click "Send SMS"
4. Wait for processing
5. Go to `/dashboard/reports`
6. **Look for**:
   - "Enhanced" badge under message
   - Severity column showing "HIGH"
   - Sentiment column showing "NEUTRAL"
7. Click "View" button
8. **You should see**:
   - "AI-Extracted Information" section
   - "Sentiment Analysis" section

### Option 2: Run Test Script
```bash
npx tsx test-enhanced-report.ts
```

This will:
- Create a test report with enhanced fields
- Print all extracted data to console
- Provide direct link to view in UI

---

## ❓ Why Don't I See Enhanced Fields?

### Reason 1: Legacy Reports
**Problem**: Reports created BEFORE Phase 1 implementation don't have enhanced fields

**Solution**: Create new reports using the simulator. Old reports will show:
- "—" in Severity column
- "—" in Sentiment column
- No "Enhanced" badge
- No AI sections in detail modal

### Reason 2: Non-Report Messages
**Problem**: FAQ/inquiry responses aren't classified as reports

**Example**: "What are the barangay office hours?"
- This gets a RAG response, not a report
- No field extraction performed
- No enhanced data available

**Solution**: Use report-triggering keywords:
- "report", "baha" (flood), "sira" (broken), "incident"
- These trigger report classification + field extraction

### Reason 3: API Key Missing
**Problem**: Without Alibaba DashScope API key, fallback extraction is basic

**Check**: Look at logs for warnings like:
```
[WARN] DashScope API key missing, using fallback field extraction
```

**Solution**: Set `ALIBABA_DASHSCOPE_API_KEY` in `.env` file

---

## 🎨 UI Screenshots Guide

### Reports Table View
```
Look for these visual elements:

1. "Enhanced" badge - Small purple badge with sparkle icon ✨
   Location: Below message text in Message column
   
2. Severity column - Color-coded badges
   RED = CRITICAL
   ORANGE = HIGH
   YELLOW = MEDIUM
   GREEN = LOW
   
3. Sentiment column - Emoji-style badges
   TEAL = POSITIVE 😊
   GRAY = NEUTRAL 😐
   RED = NEGATIVE 😠
```

### Report Detail Modal
```
Click "View" on any report with "Enhanced" badge to see:

┌─────────────────────────────────────────┐
│ Report Details                    ✕     │
├─────────────────────────────────────────┤
│ [Category] [Priority] [Status]          │
│                                         │
│ Phone Number: 09171234567               │
│ Message: May baha banda sa amin...     │
│                                         │
│ ═══════════════════════════════════════ │
│ AI-Extracted Information        ← NEW   │
│ ═══════════════════════════════════════ │
│ Summary: ...                            │
│ Location: ... | Time: ...              │
│ Incident Type: ... | Severity: ...     │
│ Recommended Action: ...                 │
│                                         │
│ ═══════════════════════════════════════ │
│ Sentiment Analysis              ← NEW   │
│ ═══════════════════════════════════════ │
│ Sentiment: NEUTRAL (85%)                │
│ Keywords: [baha] [report]               │
│                                         │
│ [Category ▼] [Priority ▼] [Status ▼]   │
│ [Resolution textarea]                   │
│ [Add to Knowledge Base] [Update Report] │
└─────────────────────────────────────────┘
```

---

## 📊 Field Extraction Examples

### Example 1: Flooding Report
**Input**: `"May baha banda sa amin near barangay hall kanina 3pm"`

**Extracted**:
- Location: "Near barangay hall"
- Time: "Today, 3:00 PM"
- Incident Type: "Flooding"
- Severity: HIGH
- Action: "Deploy sandbags and drainage crew..."
- Sentiment: NEUTRAL

### Example 2: Noise Complaint
**Input**: `"GRABE NA YUNG INGAY NG KAPITBAHAY NAMIN! Wala bang magawa?!"`

**Extracted**:
- Location: "Not specified"
- Time: "Not specified"
- Incident Type: "Peace and order issue"
- Severity: HIGH
- Action: "Dispatch barangay tanod to address disturbance..."
- Sentiment: NEGATIVE

### Example 3: Streetlight Issue
**Input**: `"Sira yung ilaw sa poste banda sa Zone 3 kahapon pa"`

**Extracted**:
- Location: "Zone 3"
- Time: "Yesterday"
- Incident Type: "Streetlight issue"
- Severity: MEDIUM
- Action: "Schedule repair crew for streetlight in Zone 3"
- Sentiment: NEUTRAL

---

## ✅ Checklist: Verify Enhanced Fields Are Working

- [ ] Go to `/dashboard/reports`
- [ ] Create new report via `/simulator`
- [ ] See "Enhanced" badge appear in Message column
- [ ] See Severity column populated (not "—")
- [ ] See Sentiment column populated (not "—")
- [ ] Click "View" button
- [ ] Modal shows "AI-Extracted Information" section
- [ ] Modal shows "Sentiment Analysis" section
- [ ] All fields show data or "Not specified"
- [ ] Go to `/dashboard/conversations`
- [ ] Click conversation with report
- [ ] See purple chevron icon on message
- [ ] Click chevron to expand AI panel
- [ ] See all extracted fields displayed

---

## 🐛 Troubleshooting

### Issue: No "Enhanced" badge visible
**Check**: Reports table has Severity/Sentiment columns?
**Fix**: Refresh page, table structure was just updated

### Issue: Modal doesn't show AI sections
**Check**: Are you viewing a NEW report (created after Phase 1)?
**Fix**: Create new report via simulator, old reports don't have fields

### Issue: Chevron icon not appearing in conversations
**Check**: Is the message linked to a report?
**Fix**: Only messages with `metadata.reportId` show chevron

### Issue: All fields show "Not specified"
**Check**: Is `ALIBABA_DASHSCOPE_API_KEY` set?
**Fix**: Fallback extraction works but is basic, add API key for better results

---

**Last Updated**: November 19, 2025  
**Status**: ✅ Fully Implemented  
**Next Steps**: Create test reports to see enhanced fields in action!
