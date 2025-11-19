"use client";

import { ActionIcon, Badge, Button, Card, Group, Modal, Stack, Table, Tabs, TagsInput, Text, Textarea, TextInput, Title, Paper } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { useForm, zodResolver } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconFileText, IconPlus, IconTrash, IconUpload, IconX, IconBook, IconReportSearch, IconEye } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { useDocumentsStore } from "@/store/documentsStore";
import { useReportStore } from "@/store/reportStore";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  source: z.string().min(3, "Source must be at least 3 characters").or(z.string().min(0)).optional().nullable(),
  content: z.string().min(20, "Content must be at least 20 characters").or(z.string().min(0)).optional().nullable(),
  tags: z.array(z.string()).optional()
});

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
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; content: string } | null>(null);
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      title: "",
      source: "",
      content: "",
      tags: [] as string[]
    },
    validate: zodResolver(schema)
  });

  useEffect(() => {
    void fetchDocuments();
    void fetchReports();
  }, [fetchDocuments, fetchReports]);

  const knowledgeReports = reports.filter(r => r.addedToKnowledge);

  const handleSubmit = async (values: typeof form.values) => {
    setUploading(true);
    try {
      let fileData: { file?: string; fileType?: string } = {};

      // If file is uploaded, convert to base64
      if (uploadFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });

        const ext = uploadFile.name.split(".").pop()?.toLowerCase();
        let fileType: "pdf" | "docx" | "txt" | "image" = "txt";
        
        if (ext === "pdf") fileType = "pdf";
        else if (ext === "docx" || ext === "doc") fileType = "docx";
        else if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext || "")) fileType = "image";

        fileData = { file: base64, fileType };
      }

      await uploadDocument({
        title: values.title,
        source: values.source,
        content: values.content || undefined,
        tags: values.tags || [],
        ...fileData
      });
      
      notifications.show({
        title: "Success",
        message: "Document uploaded successfully",
        color: "teal"
      });
      form.reset();
      setUploadFile(null);
      close();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to upload document",
        color: "red"
      });
    } finally {
      setUploading(false);
    }
  };

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
      setPreviewDoc({ title: doc.title, content: doc.content });
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
          <Card withBorder shadow="sm">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Source</Table.Th>
                  <Table.Th>Tags</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed">
                        Loading documents...
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
                {!loading && documents.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed">
                        No documents yet. Add your first document to build the knowledge base.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
                {documents.map((doc) => (
                  <Table.Tr key={doc.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconFileText size={16} />
                        <Text fw={500}>{doc.title}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{doc.source}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {Array.isArray(doc.tags) &&
                          doc.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} size="sm" variant="light">
                              {tag}
                            </Badge>
                          ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(doc.createdAt).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="subtle" color="blue" onClick={() => void handlePreview(doc.id)}>
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => void handleDelete(doc.id, doc.title)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="reports" pt="md">
          <Card withBorder shadow="sm">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Issue</Table.Th>
                  <Table.Th>Resolution</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Added</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {knowledgeReports.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed">
                        No resolved reports added to knowledge base yet.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
                {knowledgeReports.map((report) => (
                  <Table.Tr key={report.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {report.phoneNumber}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={2}>
                        {report.message}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={2} c="dimmed">
                        {report.resolution || "N/A"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" color="violet">
                        {report.category}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString() : "N/A"}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={close} title="Add Knowledge Document" size="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Title" placeholder="Ordinances 2024" withAsterisk {...form.getInputProps("title")} />
            <TextInput label="Source" placeholder="ordinances-2024.md" {...form.getInputProps("source")} />
            
            <Dropzone
              onDrop={(files) => setUploadFile(files[0])}
              onReject={() => notifications.show({ title: "Error", message: "Invalid file", color: "red" })}
              maxSize={10 * 1024 ** 2}
              accept={[MIME_TYPES.pdf, MIME_TYPES.docx, MIME_TYPES.png, MIME_TYPES.jpeg, "text/plain"]}
            >
              <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: "none" }}>
                <Dropzone.Accept>
                  <IconUpload size={52} stroke={1.5} />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX size={52} stroke={1.5} />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconUpload size={52} stroke={1.5} />
                </Dropzone.Idle>

                <div>
                  <Text size="xl" inline>
                    {uploadFile ? uploadFile.name : "Drag file here or click to select"}
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                    Supports PDF, DOCX, TXT, and images (PNG, JPG)
                  </Text>
                </div>
              </Group>
            </Dropzone>
            
            <Textarea
              label="Content (optional if uploading file)"
              placeholder="Full text content..."
              minRows={6}
              {...form.getInputProps("content")}
            />
            <TagsInput 
              label="Tags" 
              placeholder="Press Enter to add tags" 
              {...form.getInputProps("tags")} 
            />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={uploading}>
                Upload
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={previewOpened} onClose={closePreview} title={previewDoc?.title} size="xl">
        <Paper p="md" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Text style={{ whiteSpace: 'pre-wrap' }}>{previewDoc?.content}</Text>
        </Paper>
      </Modal>
    </Stack>
  );
}
