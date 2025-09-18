'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Quote } from '@/lib/data';
import { quotes } from '@/lib/data';
import { formatNotional, formatRelativeTime } from '@/lib/format';

function statusStyle(status: Quote['status']) {
  switch (status) {
    case 'Open':
      return 'badge-success';
    case 'Filled':
      return 'badge-warning';
    default:
      return 'badge-danger';
  }
}

export default function QuotesPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | Quote['status']>('all');
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesQuery = `${quote.id} ${quote.pair} ${quote.trader}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = status === 'all' || quote.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const soonestExpiry = useMemo(() => {
    const openQuotes = filtered.filter((quote) => quote.status === 'Open');
    if (openQuotes.length === 0) return null;
    return openQuotes.reduce((soonest, quote) => {
      return new Date(quote.expiry) < new Date(soonest.expiry) ? quote : soonest;
    });
  }, [filtered, clock]);

  return (
    <div className="space-y-6">
      <div className="section-card space-y-4">
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Search quotes"
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="tab-bar w-full sm:w-auto">
            {['all', 'Open', 'Filled', 'Expired'].map((value) => (
              <button
                key={value}
                type="button"
                className={`tab-button ${status === value ? 'active' : ''}`}
                onClick={() => setStatus(value as typeof status)}
              >
                {value === 'all' ? 'All statuses' : value}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">{filtered.length} quotes</span>
        </div>
        {soonestExpiry ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">Next expiry</div>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{soonestExpiry.id}</div>
                <div className="text-xs text-slate-400">{soonestExpiry.pair} • {soonestExpiry.trader}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{formatRelativeTime(soonestExpiry.expiry)}</div>
                <div className="timer">Expires at {new Date(soonestExpiry.expiry).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="section-card">
        <table className="table">
          <thead>
            <tr>
              <th>Quote</th>
              <th>Trader</th>
              <th>Notional</th>
              <th>Price</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((quote) => (
              <tr key={quote.id}>
                <td className="text-sm font-semibold text-white">{quote.id}</td>
                <td>{quote.trader}</td>
                <td>{formatNotional(quote.notional)}</td>
                <td>{quote.price.toFixed(4)}</td>
                <td>
                  <span className="text-sm text-slate-200">{formatRelativeTime(quote.expiry)}</span>
                  <div className="timer">{new Date(quote.expiry).toLocaleTimeString()}</div>
                </td>
                <td>
                  <span className={`badge ${statusStyle(quote.status)}`}>{quote.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
