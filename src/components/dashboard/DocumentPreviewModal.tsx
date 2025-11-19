import { Button, Group, Modal, Paper, Stack, Text } from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";
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
  } | null;
  onDownload: (id: string) => void;
};

export function DocumentPreviewModal({ opened, onClose, document, onDownload }: DocumentPreviewModalProps) {
  if (!document) return null;

  return (
    <Modal opened={opened} onClose={onClose} title={document.title} size="xl">
      <Stack gap="md">
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
