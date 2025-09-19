'use client';

import { useMemo, useState } from 'react';

import { auditLog } from '@/lib/data';
import { formatDate } from '@/lib/format';

export default function AuditPage() {
  const [query, setQuery] = useState('');
  const [actor, setActor] = useState<string>('All users');
  const [entity, setEntity] = useState<string>('All entities');

  const actors = useMemo(
    () => ['All users', ...Array.from(new Set(auditLog.map((entry) => entry.actor)))],
    []
  );
  const entities = useMemo(
    () => ['All entities', ...Array.from(new Set(auditLog.map((entry) => entry.entity)))],
    []
  );

  const filtered = useMemo(() => {
    return auditLog.filter((entry) => {
      const matchesQuery = `${entry.action} ${entry.metadata} ${entry.ip}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesActor = actor === 'All users' || entry.actor === actor;
      const matchesEntity = entity === 'All entities' || entry.entity === entity;
      return matchesQuery && matchesActor && matchesEntity;
    });
  }, [actor, entity, query]);

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
          <select className="filter-pill" value={entity} onChange={(event) => setEntity(event.target.value)}>
            {entities.map((value) => (
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
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.createdAt)}</td>
                <td>{entry.actor}</td>
                <td className="font-medium text-white">{entry.action}</td>
                <td>{entry.entity}</td>
                <td>{entry.metadata}</td>
                <td>{entry.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
