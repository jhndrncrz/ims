"use client";

import { Badge, Text, Stack, Button, Paper, TextInput, ActionIcon, Group, Combobox, InputBase, useCombobox } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import { IconSearch, IconX, IconCalendar, IconFilterOff, IconFilter } from "@tabler/icons-react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import sortBy from "lodash/sortBy";
import { createElement, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  categoryColors,
  categoryIcons,
  categoryOptions
} from "@/constants/reportConstants";

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

const PAGE_SIZE = 15;

export function ResolvedReportsTable({ reports }: ResolvedReportsTableProps) {
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Report>>({
    columnAccessor: "resolvedAt",
    direction: "desc",
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [debouncedQuery] = useDebouncedValue(searchQuery, 200);

  // Combobox store for category filter
  const categoryCombobox = useCombobox();

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setDateRange([null, null]);
  };

  const hasActiveFilters = searchQuery !== "" || selectedCategories.length > 0 || dateRange[0] !== null || dateRange[1] !== null;

  // Filter, sort, and paginate reports
  const { paginatedRecords, totalFiltered } = useMemo(() => {
    const filtered = reports.filter((report) => {
      // Text search across phone, message, and resolution
      if (debouncedQuery !== "") {
        const query = debouncedQuery.toLowerCase();
        const searchableText = `${report.phoneNumber} ${report.message} ${report.resolution || ""}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(report.category)) {
        return false;
      }

      // Date range filter
      if (dateRange[0] || dateRange[1]) {
        const reportDate = report.resolvedAt ? dayjs(report.resolvedAt) : null;
        if (!reportDate) return false;
        if (dateRange[0] && reportDate.isBefore(dayjs(dateRange[0]), 'day')) return false;
        if (dateRange[1] && reportDate.isAfter(dayjs(dateRange[1]), 'day')) return false;
      }

      return true;
    });

    // Sort
    const sorted = sortBy(filtered, (report) => {
      const value = report[sortStatus.columnAccessor as keyof Report];
      // Handle date sorting
      if (sortStatus.columnAccessor === "resolvedAt") {
        return value ? dayjs(value as string).unix() : 0;
      }
      return value;
    });

    const finalRecords = sortStatus.direction === "desc" ? sorted.reverse() : sorted;

    return {
      paginatedRecords: finalRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      totalFiltered: filtered.length,
    };
  }, [reports, page, sortStatus, debouncedQuery, selectedCategories, dateRange]);

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
            {/* Search */}
            <TextInput
              placeholder="Search phone, issue, or resolution..."
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
              placeholder="Filter by resolved date"
              value={dateRange}
              onChange={setDateRange}
              leftSection={<IconCalendar size={16} />}
              clearable
            />

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
        noRecordsText="No resolved reports added to knowledge base yet"
        loadingText="Loading..."
        paginationActiveBackgroundColor="blue"
        paginationSize="sm"
        height={600}
        records={paginatedRecords}
        columns={[
          {
            accessor: "phoneNumber",
            title: "Phone",
            sortable: true,
            width: 130,
            render: (report) => (
              <Text size="sm" fw={500}>
                {report.phoneNumber}
              </Text>
            ),
          },
          {
            accessor: "message",
            title: "Issue",
            sortable: true,
            render: (report) => (
              <Text size="sm" lineClamp={2}>
                {report.message}
              </Text>
            ),
          },
          {
            accessor: "resolution",
            title: "Resolution",
            sortable: true,
            render: (report) => (
              <Text size="sm" lineClamp={2} c="dimmed">
                {report.resolution || "N/A"}
              </Text>
            ),
          },
          {
            accessor: "category",
            title: "Category",
            sortable: true,
            width: 150,
            render: (report) => (
              <Badge
                color={categoryColors[report.category as keyof typeof categoryColors] || "violet"}
                size="sm"
                leftSection={createElement(
                  categoryIcons[report.category as keyof typeof categoryIcons] || categoryIcons.OTHER,
                  { size: 12 }
                )}
              >
                {report.category}
              </Badge>
            ),
          },
          {
            accessor: "resolvedAt",
            title: "Added",
            sortable: true,
            width: 150,
            render: (report) => (
              <Text size="sm">
                {report.resolvedAt ? dayjs(report.resolvedAt).format("MMM DD, YYYY") : "N/A"}
              </Text>
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
