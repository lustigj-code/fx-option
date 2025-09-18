'use client';

import { useEffect, useRef, useState } from 'react';

type Metrics = {
  quotesActive: number;
  paymentsPending: number;
  hedgesOpen: number;
  auditsToday: number;
  lastUpdated: string;
};

const initialState: Metrics = {
  quotesActive: 0,
  paymentsPending: 0,
  hedgesOpen: 0,
  auditsToday: 0,
  lastUpdated: '—'
};

export function RealtimeCounters() {
  const [metrics, setMetrics] = useState<Metrics>(initialState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const source = new EventSource('/api/stream');
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Metrics;
        setMetrics(payload);
      } catch (error) {
        console.error('Failed to parse metrics payload', error);
      }
    };
    source.onerror = () => {
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          setMetrics(initialState);
          timeoutRef.current = null;
        }, 5000);
      }
    };
    return () => {
      source.close();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="text-sm uppercase tracking-wide text-slate-400">Active Quotes</div>
        <div className="stat-value">{metrics.quotesActive}</div>
        <div className="timer">Updated {metrics.lastUpdated}</div>
      </div>
      <div className="stat-card">
        <div className="text-sm uppercase tracking-wide text-slate-400">Pending Payments</div>
        <div className="stat-value">{metrics.paymentsPending}</div>
        <div className="timer">Updated {metrics.lastUpdated}</div>
      </div>
      <div className="stat-card">
        <div className="text-sm uppercase tracking-wide text-slate-400">Open Hedges</div>
        <div className="stat-value">{metrics.hedgesOpen}</div>
        <div className="timer">Updated {metrics.lastUpdated}</div>
      </div>
      <div className="stat-card">
        <div className="text-sm uppercase tracking-wide text-slate-400">Audit Events Today</div>
        <div className="stat-value">{metrics.auditsToday}</div>
        <div className="timer">Updated {metrics.lastUpdated}</div>
      </div>
    </div>
  );
}
