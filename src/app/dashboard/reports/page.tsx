"use client";

import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { useReportStore } from "@/store/reportStore";
import type { ReportDTO } from "@/types/report";
import { ReportDetailModal } from "@/components/dashboard/ReportDetailModal";
import { ReportsTable } from "@/components/dashboard/ReportsTable";
import { ManualReportModal } from "@/components/dashboard/ManualReportModal";

export default function ReportsPage() {
  const reports = useReportStore((state) => state.reports);
  const loading = useReportStore((state) => state.loading);
  const fetchReports = useReportStore((state) => state.fetchReports);
  const createReport = useReportStore((state) => state.createReport);
  const [selectedReport, setSelectedReport] = useState<ReportDTO | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [manualEntryOpened, manualEntryHandlers] = useDisclosure(false);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const handleRowClick = (report: ReportDTO) => {
    setSelectedReport(report);
    open();
  };

  const handleClose = () => {
    close();
    setSelectedReport(null);
  };

  const handleManualReportSuccess = () => {
    void fetchReports();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Citizen Reports</Title>
          <Text c="dimmed" size="sm">
            View and manage reports submitted by citizens via SMS
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={manualEntryHandlers.open}>
          Manual Report Entry
        </Button>
      </Group>

      <ReportsTable
        reports={reports}
        loading={loading}
        onRowClick={handleRowClick}
      />

      <ReportDetailModal report={selectedReport} opened={opened} onClose={handleClose} />

      <ManualReportModal
        opened={manualEntryOpened}
        onClose={manualEntryHandlers.close}
        onSuccess={handleManualReportSuccess}
        createReport={createReport}
      />
    </Stack>
  );
}
