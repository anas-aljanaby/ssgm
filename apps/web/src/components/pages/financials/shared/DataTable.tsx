import React, { useState, useMemo, useCallback } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T) => string;
  getRowClassName?: (row: T, index: number) => string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

type SortDir = 'asc' | 'desc';

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  getRowKey,
  getRowClassName,
  emptyMessage = 'No data available',
  emptyActionLabel,
  onEmptyAction,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDir]);

  const alignClass = (align?: 'left' | 'right' | 'center') => {
    if (align === 'right') return 'text-end';
    if (align === 'center') return 'text-center';
    return 'text-start';
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${alignClass(col.align)} ${
                  col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors' : ''
                }`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-xs">
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
              >
                <div className="flex flex-col items-center gap-3">
                  <p>{emptyMessage}</p>
                  {onEmptyAction && emptyActionLabel ? (
                    <button
                      type="button"
                      onClick={onEmptyAction}
                      className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark transition-colors"
                    >
                      {emptyActionLabel}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIdx) => {
              const customClass = getRowClassName?.(row, rowIdx) ?? '';
              const zebra =
                customClass.includes('bg-emerald') || customClass.includes('animate-pulse')
                  ? ''
                  : rowIdx % 2 === 1
                    ? 'bg-gray-50/50 dark:bg-slate-800/25'
                    : '';

              return (
              <tr
                key={getRowKey ? getRowKey(row) : rowIdx}
                data-highlight-id={getRowKey ? getRowKey(row) : undefined}
                className={`border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors duration-500 ${zebra} ${customClass} ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-foreground dark:text-dark-foreground ${alignClass(col.align)}`}
                  >
                    {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
