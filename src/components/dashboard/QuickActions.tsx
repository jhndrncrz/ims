import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconArrowRight, IconBell, IconUsers } from "@tabler/icons-react";
import Link from "next/link";

type QuickActionsProps = {
  openReportsCount: number;
};

export function QuickActions({ openReportsCount }: QuickActionsProps) {
  return (
    <Card withBorder shadow="sm">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="sm">Quick Actions</Text>
      </Group>
      <Stack gap="xs">
        <Button 
          component={Link} 
          href="/dashboard/reports" 
          variant="light" 
          leftSection={<IconBell size={16} />}
          rightSection={<IconArrowRight size={16} />}
          fullWidth
          justify="space-between"
        >
          View {openReportsCount} Open Reports
        </Button>
        <Button 
          component={Link} 
          href="/dashboard/conversations" 
          variant="light" 
          color="violet"
          leftSection={<IconUsers size={16} />}
          rightSection={<IconArrowRight size={16} />}
          fullWidth
          justify="space-between"
        >
          Check Conversations
        </Button>
      </Stack>
    </Card>
  );
}
