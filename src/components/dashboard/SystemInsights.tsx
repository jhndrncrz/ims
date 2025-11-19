import { Alert, Badge, Card, Group, Stack, Text } from "@mantine/core";
import { IconAlertTriangle, IconBell, IconChecks, IconInfoCircle } from "@tabler/icons-react";

type SystemInsightsProps = {
  openCount: number;
  avgConfidence: number;
  resolutionRate: number;
  totalReports: number;
  reportsWithConfidence: number;
  highPriorityOpenCount: number;
};

export function SystemInsights({ 
  openCount, 
  avgConfidence, 
  resolutionRate, 
  totalReports,
  reportsWithConfidence,
  highPriorityOpenCount
}: SystemInsightsProps) {
  return (
    <Card withBorder shadow="sm">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="sm">System Insights</Text>
      </Group>
      <Stack gap="md">
        {openCount > 5 && (
          <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
            <Text size="sm" fw={500}>High Open Reports</Text>
            <Text size="xs" c="dimmed">You have {openCount} open reports. Consider addressing high-priority items.</Text>
          </Alert>
        )}
        {avgConfidence < 50 && reportsWithConfidence > 0 && (
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
            <Text size="sm" fw={500}>Low AI Confidence</Text>
            <Text size="xs" c="dimmed">Average confidence is {avgConfidence.toFixed(0)}%. Add more documents to improve accuracy.</Text>
          </Alert>
        )}
        {resolutionRate < 30 && totalReports > 0 && (
          <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
            <Text size="sm" fw={500}>Low Resolution Rate</Text>
            <Text size="xs" c="dimmed">Only {resolutionRate.toFixed(0)}% of reports are closed. Review and resolve pending reports.</Text>
          </Alert>
        )}
        {openCount === 0 && totalReports > 0 && (
          <Alert icon={<IconChecks size={16} />} color="teal" variant="light">
            <Text size="sm" fw={500}>All Caught Up!</Text>
            <Text size="xs" c="dimmed">No open reports. Great job keeping up with citizen concerns!</Text>
          </Alert>
        )}
        {highPriorityOpenCount > 0 && (
          <Alert icon={<IconBell size={16} />} color="red" variant="light">
            <Text size="sm" fw={500}>Urgent Items</Text>
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                {highPriorityOpenCount} high-priority reports need attention.
              </Text>
              <Badge size="xs" color="red">ACTION REQUIRED</Badge>
            </Group>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
