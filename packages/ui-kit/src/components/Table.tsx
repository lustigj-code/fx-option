import * as React from 'react';

import { cn } from '../lib/utils';

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface TableProps<T> extends React.TableHTMLAttributes<HTMLTableElement> {
  columns: TableColumn<T>[];
  data: T[];
}

export function Table<T>({ className, columns, data, ...props }: TableProps<T>) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-accent-muted/30 bg-card/80 shadow-soft', className)}>
      <table className="min-w-full divide-y divide-accent-muted/30" {...props}>
        <thead className="bg-card/60 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-accent-muted/10 text-sm text-text">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-accent-muted/10">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3 text-muted">
                  {column.render ? column.render(row[column.key], row) : (row[column.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
