import { Badge, Card, Table, Text } from "@mantine/core";

type Report = {
  id: string;
  phoneNumber: string;
  message: string;
  resolution?: string | null;
  category: string;
  resolvedAt?: string | null;
};

type ResolvedReportsTableProps = {
  reports: Report[];
};

export function ResolvedReportsTable({ reports }: ResolvedReportsTableProps) {
  return (
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
          {reports.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text size="sm" c="dimmed">
                  No resolved reports added to knowledge base yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
          {reports.map((report) => (
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
  );
}
