'use client';

import { useMemo, useState } from 'react';

import type { ControlRoomEvent } from '@/lib/data';
import { events } from '@/lib/data';
import { formatDate } from '@/lib/format';

function severityStyle(severity: ControlRoomEvent['severity']) {
  switch (severity) {
    case 'critical':
      return 'badge-danger';
    case 'warning':
      return 'badge-warning';
    default:
      return 'badge-success';
  }
}

function severityLabel(severity: ControlRoomEvent['severity']) {
  return severity.toUpperCase();
}

export default function EventsPage() {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<'all' | ControlRoomEvent['severity']>('all');

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const matchesQuery = `${event.message} ${event.source} ${event.type}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesSeverity = severity === 'all' || event.severity === severity;
      return matchesQuery && matchesSeverity;
    });
  }, [query, severity]);

  return (
    <div className="section-card space-y-6">
      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search events"
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="tab-bar w-full sm:w-auto">
          {['all', 'info', 'warning', 'critical'].map((value) => (
            <button
              key={value}
              type="button"
              className={`tab-button ${severity === value ? 'active' : ''}`}
              onClick={() => setSeverity(value as typeof severity)}
            >
              {value === 'all' ? 'All severities' : severityLabel(value as ControlRoomEvent['severity'])}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{filtered.length} events</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Type</th>
            <th>Message</th>
            <th>Source</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((event) => (
            <tr key={event.id}>
              <td>{formatDate(event.createdAt)}</td>
              <td className="font-medium text-white">{event.type}</td>
              <td>{event.message}</td>
              <td>{event.source}</td>
              <td>
                <span className={`badge ${severityStyle(event.severity)}`}>{severityLabel(event.severity)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
