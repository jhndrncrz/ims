"use client";

import { Button, Card, Grid, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { AreaChart, BarChart } from "@mantine/charts";
import { IconAlertTriangle, IconCalendar, IconChecks, IconClock, IconFilterOff, IconReport, IconTrendingUp, IconUsers } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";

import { useReportStore } from "@/store/reportStore";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SystemInsights } from "@/components/dashboard/SystemInsights";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PriorityReportsWidget } from "@/components/dashboard/PriorityReportsWidget";
import { ReportDetailModal } from "@/components/dashboard/ReportDetailModal";
import type { ReportDTO } from "@/types/report";

export default function DashboardPage() {
  const allReports = useReportStore((state) => state.reports);
  const fetchReports = useReportStore((state) => state.fetchReports);
  const [selectedReport, setSelectedReport] = useState<ReportDTO | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  // Filter reports by date range
  const reports = useMemo(() => {
    if (!dateRange[0] && !dateRange[1]) {
      return allReports;
    }
    
    return allReports.filter((report) => {
      const reportDate = dayjs(report.createdAt);
      if (dateRange[0] && reportDate.isBefore(dayjs(dateRange[0]), 'day')) return false;
      if (dateRange[1] && reportDate.isAfter(dayjs(dateRange[1]), 'day')) return false;
      return true;
    });
  }, [allReports, dateRange]);

  const clearDateFilter = () => {
    setDateRange([null, null]);
  };

  const handleViewReport = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReport(report);
      openDetail();
    }
  };

  const handleCloseDetail = () => {
    closeDetail();
    setSelectedReport(null);
  };

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "OPEN").length,
    acknowledged: reports.filter((r) => r.status === "ACKNOWLEDGED").length,
    closed: reports.filter((r) => r.status === "CLOSED").length
  };

  const uniqueCallers = new Set(reports.map((r) => r.phoneNumber)).size;
  const reportsWithConfidence = reports.filter(r => r.confidence);
  const avgConfidence = reportsWithConfidence.length > 0
    ? (reportsWithConfidence.reduce((acc, r) => acc + (r.confidence || 0), 0) / reportsWithConfidence.length) * 100
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
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Dashboard Overview</Title>
          <Text c="dimmed" size="sm">
            Real-time insights and statistics
          </Text>
        </div>
        
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>Filter by Date Range</Text>
            <Group>
              <DatePickerInput
                type="range"
                placeholder="Select date range"
                value={dateRange}
                onChange={setDateRange}
                leftSection={<IconCalendar size={16} />}
                clearable
                style={{ minWidth: 280 }}
              />
              {(dateRange[0] || dateRange[1]) && (
                <Button
                  size="sm"
                  variant="light"
                  color="gray"
                  leftSection={<IconFilterOff size={14} />}
                  onClick={clearDateFilter}
                >
                  Clear
                </Button>
              )}
            </Group>
            {(dateRange[0] || dateRange[1]) && (
              <Text size="xs" c="dimmed">
                Showing {reports.length} of {allReports.length} reports
              </Text>
            )}
          </Stack>
        </Paper>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <StatCard icon={IconReport} label="Total Reports" value={stats.total} color="blue" />
        <StatCard icon={IconClock} label="Open" value={stats.open} color="orange" />
        <StatCard icon={IconAlertTriangle} label="Acknowledged" value={stats.acknowledged} color="yellow" />
        <StatCard icon={IconChecks} label="Closed" value={stats.closed} color="teal" />
      </SimpleGrid>

      <QuickActions openReportsCount={stats.open} />

      {/* Priority Reports Widget */}
      <PriorityReportsWidget reports={reports} onViewReport={handleViewReport} />

      <SimpleGrid cols={{ base: 1, md: 1 }}>
        <SystemInsights
          openCount={stats.open}
          avgConfidence={avgConfidence}
          resolutionRate={resolutionRate}
          totalReports={stats.total}
          reportsWithConfidence={reportsWithConfidence.length}
          highPriorityOpenCount={reports.filter(r => r.priority === "HIGH" && r.status === "OPEN").length}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <MetricCard
          icon={IconUsers}
          label="Unique Callers"
          value={uniqueCallers}
          color="violet"
        />
        <MetricCard
          icon={IconTrendingUp}
          label="Avg AI Confidence"
          value={`${avgConfidence.toFixed(0)}%`}
          color="cyan"
        />
        <MetricCard
          icon={IconChecks}
          label="Resolution Rate"
          value={`${resolutionRate.toFixed(0)}%`}
          color="teal"
          progress={resolutionRate}
        />
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

      {/* Report Detail Modal */}
      <ReportDetailModal report={selectedReport} opened={detailOpened} onClose={handleCloseDetail} />
    </Stack>
  );
}
