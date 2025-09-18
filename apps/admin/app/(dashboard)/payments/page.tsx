'use client';

import { useMemo, useState } from 'react';

import type { Payment } from '@/lib/data';
import { payments } from '@/lib/data';
import { formatAmount, formatDate } from '@/lib/format';

const regions = ['All regions', 'US', 'EU', 'APAC', 'UK'];
const statuses: Array<'All statuses' | Payment['status']> = ['All statuses', 'Pending', 'Settled', 'Failed'];

function statusStyle(status: Payment['status']) {
  switch (status) {
    case 'Settled':
      return 'badge-success';
    case 'Pending':
      return 'badge-warning';
    default:
      return 'badge-danger';
  }
}

export default function PaymentsPage() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<string>('All regions');
  const [status, setStatus] = useState<'All statuses' | Payment['status']>('All statuses');

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const matchesQuery = `${payment.counterparty} ${payment.id}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesRegion = region === 'All regions' || payment.region === region;
      const matchesStatus = status === 'All statuses' || payment.status === status;
      return matchesQuery && matchesRegion && matchesStatus;
    });
  }, [query, region, status]);

  const totalPending = useMemo(() => {
    return filtered
      .filter((payment) => payment.status === 'Pending')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="section-card space-y-4">
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Search payments"
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="filter-pill"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            {regions.map((value) => (
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
          <span className="text-xs text-slate-500">{filtered.length} records</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Pending volume</div>
          <div className="mt-1 text-2xl font-bold text-white">{formatAmount(totalPending, 'USD')}</div>
          <div className="timer">Calculated on filtered dataset</div>
        </div>
      </div>

      <div className="section-card">
        <table className="table">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Counterparty</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Region</th>
              <th>Last update</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((payment) => (
              <tr key={payment.id}>
                <td className="text-sm font-semibold text-white">{payment.id}</td>
                <td>{payment.counterparty}</td>
                <td>{formatAmount(payment.amount, payment.currency)}</td>
                <td>{payment.method}</td>
                <td>{payment.region}</td>
                <td>{formatDate(payment.updatedAt)}</td>
                <td>
                  <span className={`badge ${statusStyle(payment.status)}`}>{payment.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
