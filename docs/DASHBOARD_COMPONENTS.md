# Dashboard Components Structure

This document describes the modular component architecture for the dashboard pages.

## Component Directory: `src/components/dashboard/`

### Core UI Components

#### **StatCard.tsx**
- **Purpose**: Display key metrics with icon and value
- **Props**: `icon`, `label`, `value`, `color`
- **Used in**: Dashboard homepage (Total Reports, Open, Acknowledged, Closed)

#### **MetricCard.tsx**
- **Purpose**: Extended stat card with optional progress bar
- **Props**: `icon`, `label`, `value`, `color`, `progress?`
- **Used in**: Dashboard homepage (Unique Callers, Avg AI Confidence, Resolution Rate)

#### **QuickActions.tsx**
- **Purpose**: Quick navigation buttons to important sections
- **Props**: `openReportsCount`
- **Used in**: Dashboard homepage
- **Features**: Links to Reports and Conversations pages

#### **SystemInsights.tsx**
- **Purpose**: Conditional alerts based on system state
- **Props**: `openCount`, `avgConfidence`, `resolutionRate`, `totalReports`, `reportsWithConfidence`, `highPriorityOpenCount`
- **Used in**: Dashboard homepage
- **Features**: Dynamic alerts for high open reports, low AI confidence, low resolution rate, etc.

### Reports Components

#### **ReportsTable.tsx**
- **Purpose**: Display reports in a sortable, filterable table
- **Props**: `reports`, `loading`, `onRowClick`
- **Used in**: Reports page
- **Features**: Category badges, priority indicators, status badges, formatted dates

#### **ManualReportModal.tsx**
- **Purpose**: Form for manually creating reports (walk-ins, phone calls)
- **Props**: `opened`, `onClose`, `onSuccess`, `createReport`
- **Used in**: Reports page
- **Features**: Zod validation, phone number/message/attachment fields

#### **ReportDetailModal.tsx**
- **Purpose**: View and edit report details
- **Props**: `report`, `opened`, `onClose`
- **Used in**: Reports page
- **Features**: Status/priority/category editing, badge-styled dropdowns (Combobox pattern)

### Documents Components

#### **DocumentsTable.tsx**
- **Purpose**: Display knowledge base documents in a table
- **Props**: `documents`, `loading`, `onPreview`, `onDelete`
- **Used in**: Documents page (Documents tab)
- **Features**: Tags display, preview and delete actions

#### **ResolvedReportsTable.tsx**
- **Purpose**: Show resolved reports added to knowledge base
- **Props**: `reports`
- **Used in**: Documents page (Resolved Reports tab)
- **Features**: Issue/resolution display, category badges

#### **DocumentUploadModal.tsx**
- **Purpose**: Upload new documents to knowledge base
- **Props**: `opened`, `onClose`, `uploadDocument`
- **Used in**: Documents page
- **Features**: Drag-and-drop file upload, supports PDF/DOCX/TXT/images, base64 encoding, Zod validation

#### **DocumentPreviewModal.tsx**
- **Purpose**: Preview document content or files
- **Props**: `opened`, `onClose`, `document`, `onDownload`
- **Used in**: Documents page
- **Features**: PDF iframe preview, image display, text content, download button

### Conversations Components

#### **ConversationList.tsx**
- **Purpose**: Sidebar list of all conversations
- **Props**: `conversations`, `selectedPhoneNumber`, `onSelect`, `parseIdentifier`
- **Used in**: Conversations page
- **Features**: Channel badges (SMS/Messenger/Email), message count, last message preview

#### **ConversationDetail.tsx**
- **Purpose**: Display full message thread for selected conversation
- **Props**: `phoneNumber`, `messageCount`, `messages`, `parseIdentifier`
- **Used in**: Conversations page
- **Features**: Inbound/outbound message styling, confidence scores, formatted timestamps

## Page Structure

### `src/app/dashboard/page.tsx`
- **Components Used**: `StatCard`, `MetricCard`, `QuickActions`, `SystemInsights`
- **Additional**: Mantine Charts (AreaChart, BarChart) for data visualization
- **State**: Fetches reports from store, calculates metrics
- **Size**: ~150 lines (down from ~230 lines)

### `src/app/dashboard/reports/page.tsx`
- **Components Used**: `ReportsTable`, `ManualReportModal`, `ReportDetailModal`
- **State**: Reports list, selected report, modal states
- **Size**: ~55 lines (down from ~180 lines)

### `src/app/dashboard/documents/page.tsx`
- **Components Used**: `DocumentsTable`, `ResolvedReportsTable`, `DocumentUploadModal`, `DocumentPreviewModal`
- **State**: Documents list, reports list, preview document, modal states
- **Size**: ~80 lines (down from ~390 lines)

### `src/app/dashboard/conversations/page.tsx`
- **Components Used**: `ConversationList`, `ConversationDetail`
- **State**: Conversations list, selected conversation
- **Helper**: `parseIdentifier` function for channel detection
- **Size**: ~100 lines (down from ~200 lines)

## Benefits of Modular Architecture

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be used across multiple pages
3. **Testability**: Easier to write unit tests for isolated components
4. **Readability**: Page files are lean and focus on orchestration
5. **Type Safety**: Strong typing with TypeScript interfaces
6. **Code Organization**: Clear separation of concerns

## Component Patterns

### Mantine Badge-Styled Selects
Pattern used in `ReportDetailModal` for category/priority/status dropdowns:
```tsx
<Combobox store={combobox} onOptionSubmit={(val) => form.setFieldValue("field", val)}>
  <Combobox.Target>
    <InputBase component="button">
      <Badge color={colors[value]} leftSection={icon}>{value}</Badge>
    </InputBase>
  </Combobox.Target>
  <Combobox.Dropdown>
    <Combobox.Options>{/* options with badges */}</Combobox.Options>
  </Combobox.Dropdown>
</Combobox>
```

### Modal with Form Validation
Pattern used in `ManualReportModal` and `DocumentUploadModal`:
```tsx
const form = useForm({
  initialValues: { ... },
  validate: zodResolver(schema)
});

<Modal opened={opened} onClose={onClose}>
  <form onSubmit={form.onSubmit(handleSubmit)}>
    <TextInput {...form.getInputProps("field")} />
    <Button type="submit">Submit</Button>
  </form>
</Modal>
```

### Channel-Aware Display
Pattern used in `ConversationList` and `ConversationDetail`:
```tsx
function parseIdentifier(phoneNumber: string) {
  if (phoneNumber.startsWith("messenger:")) return { channel: "Messenger", ... };
  if (phoneNumber.startsWith("email:")) return { channel: "Email", ... };
  return { channel: "SMS", ... };
}
```

## Future Improvements

- [ ] Add loading skeletons to tables
- [ ] Implement virtual scrolling for large datasets
- [ ] Add search/filter functionality to tables
- [ ] Create shared table component with common functionality
- [ ] Add keyboard shortcuts for modal actions
- [ ] Implement optimistic UI updates
