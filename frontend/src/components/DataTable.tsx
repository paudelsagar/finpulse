"use client";

import Pagination from "@/components/Pagination";
import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string; // for alignment
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
}

export function DataTable<T extends { _id?: string; id?: string }>({
  columns,
  data,
  loading = false,
  pagination,
  onRowClick,
  emptyState,
}: DataTableProps<T>) {
  
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`h-10 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest select-none ${col.className || ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((col, j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <tr
                    key={row._id || row.id || rowIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`
                        group transition-colors hover:bg-muted/30
                        ${onRowClick ? "cursor-pointer" : ""}
                    `}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`p-4 align-top ${col.className || ""}`}>
                        {col.cell ? col.cell(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    {emptyState || (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <p>No results found.</p>
                        </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <div className="text-xs text-muted-foreground font-medium">
             Showing <span className="font-bold text-foreground">
                 {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}
             </span> to <span className="font-bold text-foreground">
                 {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
             </span> of <span className="font-bold text-foreground">
                 {pagination.totalItems}
             </span> entries
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}
