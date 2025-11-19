import { Group, Paper, Progress, Text, ThemeIcon } from "@mantine/core";

type MetricCardProps = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string | number;
  color: string;
  progress?: number;
};

export function MetricCard({ icon: Icon, label, value, color, progress }: MetricCardProps) {
  return (
    <Paper withBorder p="md">
      <Group justify="space-between">
        <div style={{ flex: 1 }}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {label}
          </Text>
          <Text size="xl" fw={700} mt="xs">
            {value}
          </Text>
          {progress !== undefined && (
            <Progress value={progress} mt="xs" color={color} size="sm" />
          )}
        </div>
        <ThemeIcon variant="light" color={color} size={36}>
          <Icon size={20} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
