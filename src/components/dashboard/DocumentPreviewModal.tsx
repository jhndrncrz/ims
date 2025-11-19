import { Badge, Button, Divider, Grid, Group, Modal, Paper, Stack, Text } from "@mantine/core";
import { IconFileText, IconCalendar, IconWeight, IconTag, IconFile } from "@tabler/icons-react";
import Image from "next/image";

type DocumentPreviewModalProps = {
  opened: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    content: string;
    fileType?: string | null;
    filePath?: string | null;
    source?: string | null;
    fileSize?: number | null;
    tags?: string[] | null;
    createdAt?: string;
  } | null;
  onDownload: (id: string) => void;
};

export function DocumentPreviewModal({ opened, onClose, document, onDownload }: DocumentPreviewModalProps) {
  if (!document) return null;

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title={document.title} size="xl">
      <Stack gap="md">
        {/* Document Metadata */}
        <Paper p="md" withBorder>
          <Grid>
            {document.source && (
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconFile size={16} />
                  <div>
                    <Text size="xs" c="dimmed">Source</Text>
                    <Text size="sm">{document.source}</Text>
                  </div>
                </Group>
              </Grid.Col>
            )}
            {document.fileType && (
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconFileText size={16} />
                  <div>
                    <Text size="xs" c="dimmed">File Type</Text>
                    <Text size="sm" tt="uppercase">{document.fileType}</Text>
                  </div>
                </Group>
              </Grid.Col>
            )}
            {document.fileSize && (
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconWeight size={16} />
                  <div>
                    <Text size="xs" c="dimmed">File Size</Text>
                    <Text size="sm">{formatFileSize(document.fileSize)}</Text>
                  </div>
                </Group>
              </Grid.Col>
            )}
            {document.createdAt && (
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconCalendar size={16} />
                  <div>
                    <Text size="xs" c="dimmed">Added</Text>
                    <Text size="sm">{formatDate(document.createdAt)}</Text>
                  </div>
                </Group>
              </Grid.Col>
            )}
          </Grid>
          
          {document.tags && Array.isArray(document.tags) && document.tags.length > 0 && (
            <>
              <Divider my="sm" />
              <Group gap="xs">
                <IconTag size={16} />
                <Text size="xs" c="dimmed">Tags:</Text>
                {document.tags.map((tag, idx) => (
                  <Badge key={idx} size="sm" variant="light">{tag}</Badge>
                ))}
              </Group>
            </>
          )}
        </Paper>
        
        {document.filePath && (
          <Group justify="flex-end">
            <Button 
              variant="light" 
              size="sm" 
              leftSection={<IconFileText size={16} />}
              onClick={() => onDownload(document.id)}
            >
              Download File
            </Button>
          </Group>
        )}
        
        {document.fileType === 'pdf' && document.filePath ? (
          <iframe
            src={`/api/documents/${document.id}/file`}
            style={{ width: '100%', height: '70vh', border: 'none' }}
            title={document.title}
          />
        ) : document.fileType === 'image' && document.filePath ? (
          <Paper p="md" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '70vh' }}>
            <Image 
              src={`/api/documents/${document.id}/file`} 
              alt={document.title}
              width={800}
              height={600}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', width: 'auto', height: 'auto' }}
              unoptimized
            />
          </Paper>
        ) : (
          <Paper p="md" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{document.content}</Text>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
}
