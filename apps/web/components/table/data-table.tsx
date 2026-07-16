"use client";

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- The table scroll region must be keyboard reachable. */

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
  type VisibilityState
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Columns3,
  Filter,
  MoreHorizontal,
  Search
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import {
  Button,
  Checkbox,
  DropdownMenu,
  EmptyState,
  ErrorState,
  Input,
  Skeleton
} from "@closeoutflow/ui";

export type TableColumn<T> = {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({
  caption,
  data,
  columns,
  emptyTitle,
  emptyDescription,
  loading = false,
  error,
  cardTitle
}: {
  caption: string;
  data: T[];
  columns: Array<TableColumn<T>>;
  emptyTitle: string;
  emptyDescription: string;
  loading?: boolean;
  error?: string;
  cardTitle?: (row: T) => ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const tableColumns = useMemo<Array<ColumnDef<T>>>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            id={`${caption}-all`}
            label={`Select all ${caption}`}
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            id={`${caption}-${row.original.id}`}
            label={`Select ${String(row.original[columns[0]!.key])}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          />
        )
      },
      ...columns.map((column) => ({
        id: column.key,
        accessorKey: column.key,
        enableSorting: column.sortable !== false,
        header: column.header,
        cell: ({ row }: { row: Row<T> }) =>
          column.render ? column.render(row.original) : String(row.original[column.key] ?? "")
      }))
    ],
    [caption, columns]
  );
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table is the approved wrapped engine.
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, globalFilter, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } }
  });
  const selected = table.getSelectedRowModel().rows.length;
  if (error) return <ErrorState description={error} onRetry={() => undefined} />;
  return (
    <section aria-label={caption} className="grid gap-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <label className="relative block min-w-64">
          <span className="sr-only">Search {caption}</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
          />
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={`Search ${caption.toLowerCase()}…`}
            className="pl-9"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled>
            <Filter aria-hidden="true" className="h-4 w-4" />
            Filters <BadgeText>Mock</BadgeText>
          </Button>
          <DropdownMenu
            trigger={
              <Button variant="outline" size="sm">
                <Columns3 aria-hidden="true" className="h-4 w-4" />
                Columns
              </Button>
            }
            items={table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => ({
                label: `${column.getIsVisible() ? "✓ " : ""}${String(column.columnDef.header)}`,
                onSelect: () => column.toggleVisibility()
              }))}
          />
        </div>
      </div>
      {selected > 0 ? (
        <div
          role="status"
          className="sticky top-16 z-sticky flex items-center justify-between rounded-md border border-info-border bg-info-subtle p-3 text-sm"
        >
          <span>{selected} selected</span>
          <Button size="sm" disabled>
            Bulk actions — preview
          </Button>
        </div>
      ) : null}
      {loading ? (
        <div
          aria-busy="true"
          aria-label={`Loading ${caption}`}
          className="grid gap-2 rounded-lg border p-4"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : table.getRowModel().rows.length === 0 ? (
        <EmptyState
          title={globalFilter ? "No matches" : emptyTitle}
          description={
            globalFilter ? "Try a different search or clear the current query." : emptyDescription
          }
          action={
            globalFilter ? (
              <Button variant="outline" onClick={() => setGlobalFilter("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div
            className="hidden overflow-x-auto rounded-lg border md:block"
            tabIndex={0}
            role="region"
            aria-label={`${caption} table, horizontally scrollable`}
          >
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead className="sticky top-0 bg-surface-sunken">
                <tr>
                  {table.getHeaderGroups()[0]!.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={
                          sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : header.column.getCanSort()
                                ? "none"
                                : undefined
                        }
                        className="h-11 border-b px-3 font-medium"
                      >
                        {header.column.getCanSort() ? (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex min-h-9 items-center gap-1"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? (
                              <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                            ) : sorted === "desc" ? (
                              <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown
                                aria-hidden="true"
                                className="h-3.5 w-3.5 text-muted-foreground"
                              />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="h-[var(--row-h)] border-b last:border-0 hover:bg-muted/60"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {table.getRowModel().rows.map((row) => (
              <article key={row.id} className="rounded-lg border bg-surface p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="font-medium">
                    {cardTitle ? cardTitle(row.original) : String(row.original[columns[0]!.key])}
                  </div>
                  <Checkbox
                    id={`${caption}-mobile-${row.original.id}`}
                    label={`Select ${String(row.original[columns[0]!.key])}`}
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                  />
                </div>
                <dl className="grid gap-2">
                  {columns
                    .slice(1)
                    .filter((column) => table.getColumn(column.key)?.getIsVisible())
                    .map((column) => (
                      <div key={column.key} className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
                        <dt className="text-muted-foreground">{column.header}</dt>
                        <dd>
                          {column.render
                            ? column.render(row.original)
                            : String(row.original[column.key] ?? "")}
                        </dd>
                      </div>
                    ))}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{table.getFilteredRowModel().rows.length} sample records</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <span className="tabular-nums">Page {table.getState().pagination.pageIndex + 1}</span>
          <Button
            size="sm"
            variant="outline"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

function BadgeText({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-sm bg-muted px-1.5 text-xs text-muted-foreground">{children}</span>
  );
}

export function RowActions() {
  return (
    <DropdownMenu
      trigger={
        <Button variant="ghost" size="sm" aria-label="Row actions">
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </Button>
      }
      items={[
        { label: "Open — preview", disabled: true },
        { label: "Edit — future phase", disabled: true }
      ]}
    />
  );
}
