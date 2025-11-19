import { ActionIcon, Badge, Card, Group, Table, Text } from "@mantine/core";
import { IconEye, IconFileText, IconTrash } from "@tabler/icons-react";

type Document = {
  id: string;
  title: string;
  source: string;
  tags: string[];
  createdAt: string;
};

type DocumentsTableProps = {
  documents: Document[];
  loading: boolean;
  onPreview: (id: string) => void;
  onDelete: (id: string, title: string) => void;
};

export function DocumentsTable({ documents, loading, onPreview, onDelete }: DocumentsTableProps) {
  return (
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
                  <ActionIcon variant="subtle" color="blue" onClick={() => onPreview(doc.id)}>
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => onDelete(doc.id, doc.title)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
