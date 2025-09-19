'use client';

import { useMemo, useState } from 'react';

import type { HedgeOrder } from '@/lib/data';
import { hedgeOrders } from '@/lib/data';
import { formatDate } from '@/lib/format';

const desks = ['All desks', ...Array.from(new Set(hedgeOrders.map((order) => order.desk)))];
const statuses: Array<'All statuses' | HedgeOrder['status']> = ['All statuses', 'Working', 'Partial', 'Hedged', 'Rejected'];

function statusStyle(status: HedgeOrder['status']) {
  switch (status) {
    case 'Hedged':
      return 'badge-success';
    case 'Rejected':
      return 'badge-danger';
    default:
      return 'badge-warning';
  }
}

export default function OrdersPage() {
  const [query, setQuery] = useState('');
  const [desk, setDesk] = useState<string>('All desks');
  const [status, setStatus] = useState<'All statuses' | HedgeOrder['status']>('All statuses');

  const filtered = useMemo(() => {
    return hedgeOrders.filter((order) => {
      const matchesQuery = `${order.id} ${order.symbol}`.toLowerCase().includes(query.toLowerCase());
      const matchesDesk = desk === 'All desks' || order.desk === desk;
      const matchesStatus = status === 'All statuses' || order.status === status;
      return matchesQuery && matchesDesk && matchesStatus;
    });
  }, [query, desk, status]);

  return (
    <div className="space-y-6">
      <div className="section-card space-y-4">
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Search hedge orders"
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="filter-pill" value={desk} onChange={(event) => setDesk(event.target.value)}>
            {desks.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            className="filter-pill"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{filtered.length} orders</span>
        </div>
      </div>

      <div className="section-card">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Strategy</th>
              <th>Desk</th>
              <th>Quantity</th>
              <th>Filled</th>
              <th>Placed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td className="text-sm font-semibold text-white">{order.id}</td>
                <td>{order.strategy}</td>
                <td>{order.desk}</td>
                <td>{order.quantity.toLocaleString()}</td>
                <td>{order.filled.toLocaleString()}</td>
                <td>{formatDate(order.placedAt)}</td>
                <td>
                  <span className={`badge ${statusStyle(order.status)}`}>{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
