"use client";

import { Card, Grid, Group, Paper, SimpleGrid, Stack, Text, Title, Progress, ThemeIcon, Button, Badge, Alert } from "@mantine/core";
import { AreaChart, BarChart } from "@mantine/charts";
import { IconAlertTriangle, IconChecks, IconClock, IconReport, IconTrendingUp, IconUsers, IconBell, IconArrowRight, IconInfoCircle } from "@tabler/icons-react";
import { useEffect } from "react";
import Link from "next/link";

import { useReportStore } from "@/store/reportStore";

export default function DashboardPage() {
  const reports = useReportStore((state) => state.reports);
  const fetchReports = useReportStore((state) => state.fetchReports);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "OPEN").length,
    acknowledged: reports.filter((r) => r.status === "ACKNOWLEDGED").length,
    closed: reports.filter((r) => r.status === "CLOSED").length
  };

  const uniqueCallers = new Set(reports.map((r) => r.phoneNumber)).size;
  const avgConfidence = reports.length > 0
    ? reports.filter(r => r.confidence).reduce((acc, r) => acc + (r.confidence || 0), 0) / reports.filter(r => r.confidence).length
    : 0;
  const resolutionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;

  const categoryData = [
    { name: "Infrastructure", count: reports.filter((r) => r.category === "INFRASTRUCTURE").length },
    { name: "Disaster", count: reports.filter((r) => r.category === "DISASTER").length },
    { name: "Admin", count: reports.filter((r) => r.category === "ADMIN").length },
    { name: "Other", count: reports.filter((r) => r.category === "OTHER").length }
  ];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const reportsOverTime = last7Days.map((date) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    reports: reports.filter((r) => r.createdAt.split("T")[0] === date).length
  }));

  const priorityData = [
    { name: "High", count: reports.filter((r) => r.priority === "HIGH").length, color: "red" },
    { name: "Medium", count: reports.filter((r) => r.priority === "MEDIUM").length, color: "yellow" },
    { name: "Low", count: reports.filter((r) => r.priority === "LOW").length, color: "green" }
  ];

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Dashboard Overview</Title>
        <Text c="dimmed" size="sm">
          Real-time insights and statistics for Barangay Mabuhay
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <StatCard icon={IconReport} label="Total Reports" value={stats.total} color="blue" />
        <StatCard icon={IconClock} label="Open" value={stats.open} color="orange" />
        <StatCard icon={IconAlertTriangle} label="Acknowledged" value={stats.acknowledged} color="yellow" />
        <StatCard icon={IconChecks} label="Closed" value={stats.closed} color="teal" />
      </SimpleGrid>

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
              View {stats.open} Open Reports
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

      {/* Quick Actions and Alerts */}
      <SimpleGrid cols={{ base: 1, md: 1 }}>
        <Card withBorder shadow="sm">
          <Group justify="space-between" mb="md">
            <Text fw={600} size="sm">System Insights</Text>
          </Group>
          <Stack gap="md">
            {stats.open > 5 && (
              <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
                <Text size="sm" fw={500}>High Open Reports</Text>
                <Text size="xs" c="dimmed">You have {stats.open} open reports. Consider addressing high-priority items.</Text>
              </Alert>
            )}
            {avgConfidence < 50 && reports.filter(r => r.confidence).length > 0 && (
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text size="sm" fw={500}>Low AI Confidence</Text>
                <Text size="xs" c="dimmed">Average confidence is {avgConfidence.toFixed(0)}%. Add more documents to improve accuracy.</Text>
              </Alert>
            )}
            {resolutionRate < 30 && stats.total > 0 && (
              <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
                <Text size="sm" fw={500}>Low Resolution Rate</Text>
                <Text size="xs" c="dimmed">Only {resolutionRate.toFixed(0)}% of reports are closed. Review and resolve pending reports.</Text>
              </Alert>
            )}
            {stats.open === 0 && stats.total > 0 && (
              <Alert icon={<IconChecks size={16} />} color="teal" variant="light">
                <Text size="sm" fw={500}>All Caught Up!</Text>
                <Text size="xs" c="dimmed">No open reports. Great job keeping up with citizen concerns!</Text>
              </Alert>
            )}
            {reports.filter(r => r.priority === "HIGH" && r.status === "OPEN").length > 0 && (
              <Alert icon={<IconBell size={16} />} color="red" variant="light">
                <Text size="sm" fw={500}>Urgent Items</Text>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    {reports.filter(r => r.priority === "HIGH" && r.status === "OPEN").length} high-priority reports need attention.
                  </Text>
                  <Badge size="xs" color="red">ACTION REQUIRED</Badge>
                </Group>
              </Alert>
            )}
          </Stack>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <Paper withBorder p="md">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Unique Callers
              </Text>
              <Text size="xl" fw={700} mt="xs">
                {uniqueCallers}
              </Text>
            </div>
            <ThemeIcon variant="light" color="violet" size={36}>
              <IconUsers size={20} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder p="md">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Avg AI Confidence
              </Text>
              <Text size="xl" fw={700} mt="xs">
                {avgConfidence.toFixed(0)}%
              </Text>
            </div>
            <ThemeIcon variant="light" color="cyan" size={36}>
              <IconTrendingUp size={20} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder p="md">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Resolution Rate
            </Text>
            <Text size="xl" fw={700} mt="xs">
              {resolutionRate.toFixed(0)}%
            </Text>
            <Progress value={resolutionRate} mt="xs" color="teal" size="sm" />
          </div>
        </Paper>
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder shadow="sm">
            <Card.Section inheritPadding py="sm" withBorder>
              <Text fw={600}>Reports Over Time</Text>
            </Card.Section>
            <Card.Section inheritPadding py="md">
              <AreaChart
                h={300}
                data={reportsOverTime}
                dataKey="date"
                series={[{ name: "reports", label: "Reports", color: "red.6" }]}
                curveType="natural"
              />
            </Card.Section>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder shadow="sm">
            <Card.Section inheritPadding py="sm" withBorder>
              <Text fw={600}>By Category</Text>
            </Card.Section>
            <Card.Section inheritPadding py="md">
              <BarChart
                h={300}
                data={categoryData}
                dataKey="name"
                series={[{ name: "count", label: "Count", color: "red.6" }]}
                orientation="vertical"
              />
            </Card.Section>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12 }}>
          <Card withBorder shadow="sm">
            <Card.Section inheritPadding py="sm" withBorder>
              <Text fw={600}>Priority Distribution</Text>
            </Card.Section>
            <Card.Section inheritPadding py="md">
              <BarChart
                h={200}
                data={priorityData}
                dataKey="name"
                series={[{ name: "count", label: "Reports", color: "red.6" }]}
                orientation="horizontal"
              />
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

type StatCardProps = {
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  label: string;
  value: number;
  color: string;
};

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Paper withBorder p="md">
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
    </Paper>
  );
}
