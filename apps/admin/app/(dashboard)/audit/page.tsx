'use client';

import { useEffect, useMemo, useState } from 'react';

import type { AuthAuditEvent, AuthAuditEventType } from '@/lib/audit-types';
import { formatDate } from '@/lib/format';

const formatMetadata = (metadata: Record<string, unknown>): string => {
  if (Object.keys(metadata).length === 0) {
    return '—';
  }
  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
};

export default function AuditPage() {
  const [query, setQuery] = useState('');
  const [actor, setActor] = useState<string>('All users');
  const [eventType, setEventType] = useState<AuthAuditEventType | 'All events'>('All events');
  const [events, setEvents] = useState<AuthAuditEvent[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await fetch('/api/audit/events');
        if (!response.ok) {
          throw new Error(`failed with status ${response.status}`);
        }
        const payload = (await response.json()) as AuthAuditEvent[];
        if (isMounted) {
          setEvents(payload);
        }
      } catch (error) {
        console.error('[admin] failed to load audit events', error);
        if (isMounted) {
          setEvents([]);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const actors = useMemo(() => ['All users', ...Array.from(new Set(events.map((entry) => entry.userId)))], [events]);
  const eventTypes = useMemo(
    () => ['All events', ...Array.from(new Set(events.map((entry) => entry.eventType)))] as (AuthAuditEventType | 'All events')[],
    [events]
  );

  const filtered = useMemo(() => {
    return events.filter((entry) => {
      const metadataText = formatMetadata(entry.metadata);
      const matchesQuery = `${entry.eventType} ${entry.userId} ${metadataText} ${entry.ip ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesActor = actor === 'All users' || entry.userId === actor;
      const matchesEvent = eventType === 'All events' || entry.eventType === eventType;
      return matchesQuery && matchesActor && matchesEvent;
    });
  }, [actor, eventType, events, query]);

  return (
    <div className="space-y-6">
      <div className="section-card space-y-4">
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Search audit trail"
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="filter-pill" value={actor} onChange={(event) => setActor(event.target.value)}>
            {actors.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select className="filter-pill" value={eventType} onChange={(event) => setEventType(event.target.value as AuthAuditEventType | 'All events')}>
            {eventTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{filtered.length} entries</span>
        </div>
      </div>

      <div className="section-card">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Event</th>
              <th>Roles</th>
              <th>Details</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.timestamp)}</td>
                <td>{entry.userId}</td>
                <td className="font-medium text-white">{entry.eventType}</td>
                <td>{entry.roles.length ? entry.roles.join(', ') : '—'}</td>
                <td>{formatMetadata(entry.metadata)}</td>
                <td>{entry.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
