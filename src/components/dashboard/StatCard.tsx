import { Card, Group, Paper, Text, ThemeIcon } from "@mantine/core";

type StatCardProps = {
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  label: string;
  value: number;
  color: string;
};

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card withBorder shadow="sm">
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {label}
          </Text>
          <Text size="xl" fw={700} mt="xs">
            {value}
          </Text>
        </div>
        <ThemeIcon variant="light" color={color} size={36}>
          <Icon size={20} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Card>
  );
}
