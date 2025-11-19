"use client";

import { ActionIcon, Badge, Group, Text, Menu, TextInput, Stack, Button, Paper, Combobox, InputBase, useCombobox } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import { IconEye, IconFileText, IconTrash, IconDotsVertical, IconSearch, IconX, IconCalendar, IconFilterOff, IconFilter } from "@tabler/icons-react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import sortBy from "lodash/sortBy";
import { useMemo, useState } from "react";
import dayjs from "dayjs";

type Document = {
  id: string;
  title: string;
  source: string;
  tags: string[];
  createdAt: string;
};

type DocumentsTableProps = {
  documents: Document[];
  loading: boolean;
  onPreview: (id: string) => void;
  onDelete: (id: string, title: string) => void;
};

const PAGE_SIZE = 10;

export function DocumentsTable({ documents, loading, onPreview, onDelete }: DocumentsTableProps) {
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Document>>({
    columnAccessor: "createdAt",
    direction: "desc",
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [debouncedQuery] = useDebouncedValue(searchQuery, 200);

  // Combobox store for tag filter
  const tagCombobox = useCombobox();

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setDateRange([null, null]);
  };

  const hasActiveFilters = searchQuery !== "" || selectedTags.length > 0 || dateRange[0] !== null || dateRange[1] !== null;

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach((doc) => {
      if (Array.isArray(doc.tags)) {
        doc.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [documents]);

  // Filter, sort, and paginate documents
  const { paginatedRecords, totalFiltered } = useMemo(() => {
    const filtered = documents.filter((doc) => {
      // Text search across title and source
      if (debouncedQuery !== "") {
        const query = debouncedQuery.toLowerCase();
        const searchableText = `${doc.title} ${doc.source}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const docTags = Array.isArray(doc.tags) ? doc.tags : [];
        if (!selectedTags.some((tag) => docTags.includes(tag))) {
          return false;
        }
      }

      // Date range filter
      if (dateRange[0] || dateRange[1]) {
        const docDate = dayjs(doc.createdAt);
        if (dateRange[0] && docDate.isBefore(dayjs(dateRange[0]), 'day')) return false;
        if (dateRange[1] && docDate.isAfter(dayjs(dateRange[1]), 'day')) return false;
      }

      return true;
    });

    // Sort
    const sorted = sortBy(filtered, (doc) => {
      const value = doc[sortStatus.columnAccessor as keyof Document];
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
  }, [documents, page, sortStatus, debouncedQuery, selectedTags, dateRange]);

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
              placeholder="Search documents by title or source..."
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

            {/* Tags Filter with Badge Preview */}
            <Combobox
              store={tagCombobox}
              onOptionSubmit={(val) => {
                setSelectedTags((current) =>
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
                  onClick={() => tagCombobox.toggleDropdown()}
                  leftSection={<IconFilter size={16} />}
                >
                  {selectedTags.length > 0 ? (
                    <Group gap="xs">
                      {selectedTags.map((tag) => (
                        <Badge key={tag} size="sm" variant="light">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Filter by tags
                    </Text>
                  )}
                </InputBase>
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  {allTags.map((tag) => (
                    <Combobox.Option key={tag} value={tag} active={selectedTags.includes(tag)}>
                      <Badge size="sm" variant="light">
                        {tag}
                      </Badge>
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
        noRecordsText="No documents found"
        loadingText="Loading..."
        paginationActiveBackgroundColor="blue"
        paginationSize="sm"
        height={500}
        records={paginatedRecords}
        fetching={loading}
        columns={[
          {
            accessor: "title",
            title: "Title",
            sortable: true,
            render: (doc) => (
              <Group gap="xs">
                <IconFileText size={16} />
                <Text fw={500}>{doc.title}</Text>
              </Group>
            ),
          },
        {
          accessor: "source",
          title: "Source",
          sortable: true,
          width: 200,
          render: (doc) => <Text size="sm">{doc.source}</Text>,
        },
          {
            accessor: "tags",
            title: "Tags",
            width: 250,
            render: (doc) => (
              <Group gap="xs">
                {Array.isArray(doc.tags) &&
                  doc.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} size="sm" variant="light">
                      {tag}
                    </Badge>
                  ))}
                {Array.isArray(doc.tags) && doc.tags.length > 3 && (
                  <Badge size="sm" variant="light" color="gray">
                    +{doc.tags.length - 3}
                  </Badge>
                )}
              </Group>
            ),
          },
        {
          accessor: "createdAt",
          title: "Created",
          sortable: true,
          width: 150,
          render: (doc) => (
            <Text size="sm">{dayjs(doc.createdAt).format("MMM DD, YYYY")}</Text>
          ),
        },
          {
            accessor: "actions",
            title: "Actions",
            width: 70,
            textAlign: "center",
            render: (doc) => (
              <Group gap={4} justify="center">
                <Menu shadow="md" width={160}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEye size={16} />}
                      onClick={() => onPreview(doc.id)}
                    >
                      Preview
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconTrash size={16} />}
                      color="red"
                      onClick={() => onDelete(doc.id, doc.title)}
                    >
                      Delete
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
