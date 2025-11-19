"use client";

import { Button, Group, Stack, Tabs, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconBook, IconReportSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { useDocumentsStore } from "@/store/documentsStore";
import { useReportStore } from "@/store/reportStore";
import { DocumentsTable } from "@/components/dashboard/DocumentsTable";
import { ResolvedReportsTable } from "@/components/dashboard/ResolvedReportsTable";
import { DocumentUploadModal } from "@/components/dashboard/DocumentUploadModal";
import { DocumentPreviewModal } from "@/components/dashboard/DocumentPreviewModal";

export default function DocumentsPage() {
  const documents = useDocumentsStore((state) => state.documents);
  const loading = useDocumentsStore((state) => state.loading);
  const fetchDocuments = useDocumentsStore((state) => state.fetchDocuments);
  const deleteDocument = useDocumentsStore((state) => state.deleteDocument);
  const uploadDocument = useDocumentsStore((state) => state.uploadDocument);
  
  const reports = useReportStore((state) => state.reports);
  const fetchReports = useReportStore((state) => state.fetchReports);
  
  const [activeTab, setActiveTab] = useState<string | null>("documents");
  const [opened, { open, close }] = useDisclosure(false);
  const [previewDoc, setPreviewDoc] = useState<{ 
    id: string;
    title: string; 
    content: string; 
    fileType?: string | null; 
    filePath?: string | null;
    source?: string | null;
    fileSize?: number | null;
    tags?: string[] | null;
    createdAt?: string;
  } | null>(null);
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);

  useEffect(() => {
    void fetchDocuments();
    void fetchReports();
  }, [fetchDocuments, fetchReports]);

  const knowledgeReports = reports.filter(r => r.addedToKnowledge);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteDocument(id);
      notifications.show({
        title: "Deleted",
        message: "Document removed from knowledge base",
        color: "teal"
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to delete document",
        color: "red"
      });
    }
  };

  const handlePreview = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`);
      if (!response.ok) throw new Error("Failed to fetch document");
      const doc = await response.json();
      setPreviewDoc({ 
        id: doc.id,
        title: doc.title, 
        content: doc.content,
        fileType: doc.fileType,
        filePath: doc.filePath,
        source: doc.source,
        fileSize: doc.fileSize,
        tags: doc.tags,
        createdAt: doc.createdAt
      });
      openPreview();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to load document preview",
        color: "red"
      });
    }
  };

  const handleDownload = (docId: string) => {
    // Use download=true query param to force download with proper filename
    const link = document.createElement('a');
    link.href = `/api/documents/${docId}/file?download=true`;
    link.click();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Knowledge Base</Title>
          <Text c="dimmed" size="sm">
            Documents and resolved reports used for AI-powered responses
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Add Document
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="documents" leftSection={<IconBook size={16} />}>
            Documents ({documents.length})
          </Tabs.Tab>
          <Tabs.Tab value="reports" leftSection={<IconReportSearch size={16} />}>
            Resolved Reports ({knowledgeReports.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="documents" pt="md">
          <DocumentsTable
            documents={documents}
            loading={loading}
            onPreview={handlePreview}
            onDelete={handleDelete}
          />
        </Tabs.Panel>

        <Tabs.Panel value="reports" pt="md">
          <ResolvedReportsTable reports={knowledgeReports} />
        </Tabs.Panel>
      </Tabs>

      <DocumentUploadModal
        opened={opened}
        onClose={close}
        uploadDocument={uploadDocument}
      />

      <DocumentPreviewModal
        opened={previewOpened}
        onClose={closePreview}
        document={previewDoc}
        onDownload={handleDownload}
      />
    </Stack>
  );
}
