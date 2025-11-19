"use client";

import { Badge, Text, Tooltip, ActionIcon, Menu, TextInput, Stack, Group, Button, Paper, Combobox, InputBase, useCombobox } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import { IconSparkles, IconDotsVertical, IconEye, IconSearch, IconX, IconCalendar, IconFilter, IconFilterOff } from "@tabler/icons-react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import sortBy from "lodash/sortBy";
import { createElement, useMemo, useState } from "react";
import dayjs from "dayjs";

import { formatDateTime } from "@/lib/formatters";
import type { ReportDTO } from "@/types/report";
import {
  categoryColors,
  categoryIcons,
  priorityColors,
  statusColors,
  statusIcons,
  categoryOptions,
  priorityOptions,
  statusOptions
} from "@/constants/reportConstants";

type ReportsTableProps = {
  reports: ReportDTO[];
  loading: boolean;
  onRowClick: (report: ReportDTO) => void;
};

const PAGE_SIZE = 15;

export function ReportsTable({ reports, loading, onRowClick }: ReportsTableProps) {
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<ReportDTO>>({
    columnAccessor: "createdAt",
    direction: "desc",
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [debouncedQuery] = useDebouncedValue(searchQuery, 200);

  // Combobox stores for badge filters
  const categoryCombobox = useCombobox();
  const priorityCombobox = useCombobox();
  const statusCombobox = useCombobox();

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedPriorities([]);
    setSelectedStatuses([]);
    setDateRange([null, null]);
  };

  const hasActiveFilters = searchQuery !== "" || selectedCategories.length > 0 || selectedPriorities.length > 0 || selectedStatuses.length > 0 || dateRange[0] !== null || dateRange[1] !== null;

  // Filter, sort, and paginate reports using useMemo
  const { paginatedRecords, totalFiltered } = useMemo(() => {
    const filtered = reports.filter((report) => {
      // Combined text search across phone, message, location, and incident type
      if (debouncedQuery !== "") {
        const query = debouncedQuery.toLowerCase();
        const searchableText = `${report.phoneNumber} ${report.message} ${report.extractedLocation || ""} ${report.incidentType || ""}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Date range filter
      if (dateRange[0] || dateRange[1]) {
        const reportDate = dayjs(report.createdAt);
        if (dateRange[0] && reportDate.isBefore(dayjs(dateRange[0]), 'day')) return false;
        if (dateRange[1] && reportDate.isAfter(dayjs(dateRange[1]), 'day')) return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(report.category)) {
        return false;
      }

      // Priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(report.priority)) {
        return false;
      }

      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(report.status)) {
        return false;
      }

      return true;
    });

    // Sort
    const sorted = sortBy(filtered, (report) => {
      const value = report[sortStatus.columnAccessor as keyof ReportDTO];
      // Handle date sorting
      if (sortStatus.columnAccessor === "createdAt") {
        return dayjs(value as string).unix();
      }
      return value;
    });

    const finalRecords = sortStatus.direction === "desc" ? sorted.reverse() : sorted;
    
    return {
      paginatedRecords: finalRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      totalFiltered: filtered.length,
    };
  }, [reports, page, sortStatus, debouncedQuery, dateRange, selectedCategories, selectedPriorities, selectedStatuses]);

  return (
    <Stack gap="md">
      {/* Filters Section */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={600}>
              Filters
            </Text>
            {hasActiveFilters && (
              <Button
                size="xs"
                variant="light"
                color="gray"
                leftSection={<IconFilterOff size={14} />}
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
            )}
          </Group>

          <Group grow align="flex-start">
            {/* Combined Search */}
            <TextInput
              placeholder="Search phone, message, location, or incident..."
              leftSection={<IconSearch size={16} />}
              rightSection={
                searchQuery && (
                  <ActionIcon
                    size="sm"
                    variant="transparent"
                    c="dimmed"
                    onClick={() => setSearchQuery("")}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                )
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />

            {/* Date Range */}
            <DatePickerInput
              type="range"
              placeholder="Filter by date range"
              value={dateRange}
              onChange={setDateRange}
              leftSection={<IconCalendar size={16} />}
              clearable
            />
          </Group>

          <Group grow align="flex-start">
            {/* Category Filter with Badge Preview */}
            <Combobox
              store={categoryCombobox}
              onOptionSubmit={(val) => {
                setSelectedCategories((current) =>
                  current.includes(val)
                    ? current.filter((v) => v !== val)
                    : [...current, val]
                );
              }}
            >
              <Combobox.Target>
                <InputBase
                  component="button"
                  type="button"
                  pointer
                  rightSection={<Combobox.Chevron />}
                  onClick={() => categoryCombobox.toggleDropdown()}
                  leftSection={<IconFilter size={16} />}
                >
                  {selectedCategories.length > 0 ? (
                    <Group gap="xs">
                      {selectedCategories.map((cat) => (
                        <Badge
                          key={cat}
                          size="sm"
                          color={categoryColors[cat as keyof typeof categoryColors]}
                          leftSection={createElement(
                            categoryIcons[cat as keyof typeof categoryIcons],
                            { size: 10 }
                          )}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Filter by category
                    </Text>
                  )}
                </InputBase>
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  {categoryOptions.map((cat) => (
                    <Combobox.Option key={cat.value} value={cat.value} active={selectedCategories.includes(cat.value)}>
                      <Group gap="xs">
                        <Badge
                          size="sm"
                          color={categoryColors[cat.value as keyof typeof categoryColors]}
                          leftSection={createElement(
                            categoryIcons[cat.value as keyof typeof categoryIcons],
                            { size: 10 }
                          )}
                        >
                          {cat.label}
                        </Badge>
                      </Group>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>

            {/* Priority Filter with Badge Preview */}
            <Combobox
              store={priorityCombobox}
              onOptionSubmit={(val) => {
                setSelectedPriorities((current) =>
                  current.includes(val)
                    ? current.filter((v) => v !== val)
                    : [...current, val]
                );
              }}
            >
              <Combobox.Target>
                <InputBase
                  component="button"
                  type="button"
                  pointer
                  rightSection={<Combobox.Chevron />}
                  onClick={() => priorityCombobox.toggleDropdown()}
                  leftSection={<IconFilter size={16} />}
                >
                  {selectedPriorities.length > 0 ? (
                    <Group gap="xs">
                      {selectedPriorities.map((prio) => (
                        <Badge
                          key={prio}
                          size="sm"
                          color={priorityColors[prio as keyof typeof priorityColors]}
                          variant="dot"
                        >
                          {prio}
                        </Badge>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Filter by priority
                    </Text>
                  )}
                </InputBase>
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  {priorityOptions.map((prio) => (
                    <Combobox.Option key={prio.value} value={prio.value} active={selectedPriorities.includes(prio.value)}>
                      <Badge
                        size="sm"
                        color={priorityColors[prio.value as keyof typeof priorityColors]}
                        variant="dot"
                      >
                        {prio.label}
                      </Badge>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>

            {/* Status Filter with Badge Preview */}
            <Combobox
              store={statusCombobox}
              onOptionSubmit={(val) => {
                setSelectedStatuses((current) =>
                  current.includes(val)
                    ? current.filter((v) => v !== val)
                    : [...current, val]
                );
              }}
            >
              <Combobox.Target>
                <InputBase
                  component="button"
                  type="button"
                  pointer
                  rightSection={<Combobox.Chevron />}
                  onClick={() => statusCombobox.toggleDropdown()}
                  leftSection={<IconFilter size={16} />}
                >
                  {selectedStatuses.length > 0 ? (
                    <Group gap="xs">
                      {selectedStatuses.map((stat) => (
                        <Badge
                          key={stat}
                          size="sm"
                          color={statusColors[stat as keyof typeof statusColors]}
                          leftSection={createElement(
                            statusIcons[stat as keyof typeof statusIcons],
                            { size: 10 }
                          )}
                        >
                          {stat}
                        </Badge>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Filter by status
                    </Text>
                  )}
                </InputBase>
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  {statusOptions.map((stat) => (
                    <Combobox.Option key={stat.value} value={stat.value} active={selectedStatuses.includes(stat.value)}>
                      <Group gap="xs">
                        <Badge
                          size="sm"
                          color={statusColors[stat.value as keyof typeof statusColors]}
                          leftSection={createElement(
                            statusIcons[stat.value as keyof typeof statusIcons],
                            { size: 10 }
                          )}
                        >
                          {stat.label}
                        </Badge>
                      </Group>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </Group>
        </Stack>
      </Paper>

      {/* DataTable */}
      <DataTable
        withTableBorder
        withColumnBorders
        borderRadius="sm"
        striped
        highlightOnHover
        verticalSpacing="sm"
        horizontalSpacing="md"
        minHeight={150}
        noRecordsText="No reports found"
        loadingText="Loading..."
        paginationActiveBackgroundColor="blue"
        paginationSize="sm"
        height={600}
        records={paginatedRecords}
        fetching={loading}
        columns={[
          {
            accessor: "phoneNumber",
            title: "Phone",
            sortable: true,
            width: 130,
          },
          {
            accessor: "message",
            title: "Message",
            sortable: true,
            render: (report) => {
            const hasEnhancedFields = Boolean(
              report.extractedLocation ||
              report.incidentType ||
              report.summaryGenerated ||
              report.sentiment
            );

            return (
              <Stack gap={4}>
                <Text size="sm" lineClamp={2}>
                  {report.message}
                </Text>
                {hasEnhancedFields && (
                  <Tooltip label="AI-enhanced data available">
                    <Badge
                      size="xs"
                      variant="light"
                      color="violet"
                      leftSection={<IconSparkles size={10} />}
                      style={{ width: "fit-content" }}
                    >
                      Enhanced
                    </Badge>
                  </Tooltip>
                )}
              </Stack>
            );
          },
        },
          {
            accessor: "category",
            title: "Category",
            sortable: true,
            width: 150,
            render: (report) => (
              <Badge
                color={categoryColors[report.category]}
                size="sm"
                leftSection={createElement(categoryIcons[report.category], { size: 12 })}
              >
                {report.category}
              </Badge>
            ),
          },
          {
            accessor: "priority",
            title: "Priority",
            sortable: true,
            width: 110,
            render: (report) => (
              <Badge color={priorityColors[report.priority]} size="sm" variant="dot">
                {report.priority}
              </Badge>
            ),
          },
          {
            accessor: "status",
            title: "Status",
            sortable: true,
            width: 140,
            render: (report) => (
              <Badge
                color={statusColors[report.status]}
                size="sm"
                leftSection={createElement(statusIcons[report.status], { size: 12 })}
              >
                {report.status}
              </Badge>
            ),
          },
          {
            accessor: "createdAt",
            title: "Received",
            sortable: true,
            width: 180,
            render: (report) => <Text size="sm">{formatDateTime(report.createdAt)}</Text>,
          },
          {
            accessor: "actions",
            title: "Actions",
            width: 70,
            textAlign: "center",
            render: (report) => (
              <Group gap={4} justify="center">
                <Menu shadow="md" width={150}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEye size={16} />}
                      onClick={() => onRowClick(report)}
                    >
                      View Details
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            ),
          },
        ]}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        totalRecords={totalFiltered}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={(p) => setPage(p)}
      />
    </Stack>
  );
}
