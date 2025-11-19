/**
 * Base configuration for Mantine DataTable
 * Provides consistent styling and behavior across all tables
 */
export const baseDataTableProps = {
  withTableBorder: true,
  withColumnBorders: true,
  borderRadius: "sm" as const,
  striped: true,
  highlightOnHover: true,
  verticalSpacing: "sm" as const,
  horizontalSpacing: "md" as const,
  minHeight: 150,
  noRecordsText: "No records found",
  loadingText: "Loading...",
  paginationActiveBackgroundColor: "blue",
  paginationSize: "sm" as const,
  paginationText: ({ from, to, totalRecords }: { from: number; to: number; totalRecords: number }) => 
    `Showing ${from} to ${to} of ${totalRecords} records`,
} as const;
