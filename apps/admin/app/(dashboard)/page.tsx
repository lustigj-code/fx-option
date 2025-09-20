import Link from 'next/link';

import { RealtimeCounters } from '@/components/RealtimeCounters';
import { auditLog, events, fetchRiskSummary, hedgeOrders, payments, quotes } from '@/lib/data';
import { formatAmount, formatDate, formatNotional } from '@/lib/format';

export default async function OverviewPage() {
  const riskPlan = await fetchRiskSummary();
  return (
    <div className="space-y-10">
      <section>
        <RealtimeCounters />
      </section>

      {riskPlan ? (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="section-card">
            <div className="section-title">Netting Savings</div>
            <div className="grid gap-2 text-sm text-slate-300">
              <span>Delta saved: {riskPlan.nettingSavings.delta.toLocaleString()}</span>
              <span>VaR saved: {riskPlan.nettingSavings.var.toLocaleString()}</span>
              <span>
                Δ%: {riskPlan.nettingSavings.deltaPct.toFixed(2)} · VaR Δ%: {riskPlan.nettingSavings.varPct.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="section-card">
            <div className="section-title">Buckets</div>
            <ul className="space-y-2 text-sm text-slate-300">
              {riskPlan.buckets.slice(0, 3).map((bucket) => (
                <li key={`${bucket.pair}-${bucket.weekStart}`}>
                  <span className="font-semibold text-white">{bucket.pair}</span> · Δ%
                  {bucket.deltaReductionPct.toFixed(2)} · VaR Δ%
                  {bucket.varReductionPct.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section-card">
        <div className="section-title">
          <span>Latest Events</span>
          <Link href="/events" className="button-secondary text-xs px-3 py-1.5">
            View all
          </Link>
        </div>
        <div className="space-y-4">
          {events.slice(0, 4).map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="font-semibold text-white">{event.type}</span>
                  <span className="text-xs text-slate-500">{formatDate(event.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-200">{event.message}</p>
                <p className="text-xs text-slate-500">Source: {event.source}</p>
              </div>
              <span
                className={`badge ${
                  event.severity === 'critical'
                    ? 'badge-danger'
                    : event.severity === 'warning'
                      ? 'badge-warning'
                      : 'badge-success'
                }`}
              >
                {event.severity.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="section-card">
          <div className="section-title">Outstanding Quotes</div>
          <table className="table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Trader</th>
                <th>Notional</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.slice(0, 4).map((quote) => (
                <tr key={quote.id}>
                  <td className="text-sm font-semibold text-white">
                    {quote.id}
                    <div className="text-xs text-slate-400">{quote.pair} @ {quote.price.toFixed(4)}</div>
                  </td>
                  <td>{quote.trader}</td>
                  <td>{formatNotional(quote.notional)}</td>
                  <td>
                    <span
                      className={`badge ${
                        quote.status === 'Open'
                          ? 'badge-success'
                          : quote.status === 'Filled'
                            ? 'badge-warning'
                            : 'badge-danger'
                      }`}
                    >
                      {quote.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="section-card">
          <div className="section-title">Payment Exceptions</div>
          <table className="table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Counterparty</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments
                .filter((payment) => payment.status !== 'Settled')
                .slice(0, 4)
                .map((payment) => (
                  <tr key={payment.id}>
                    <td className="text-sm font-semibold text-white">{payment.id}</td>
                    <td>{payment.counterparty}</td>
                    <td>{formatAmount(payment.amount, payment.currency)}</td>
                    <td>
                      <span
                        className={`badge ${
                          payment.status === 'Pending'
                            ? 'badge-warning'
                            : payment.status === 'Failed'
                              ? 'badge-danger'
                              : 'badge-success'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-card">
        <div className="section-title">Hedge Orders</div>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Desk</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {hedgeOrders.slice(0, 4).map((order) => (
              <tr key={order.id}>
                <td className="text-sm font-semibold text-white">
                  {order.id}
                  <div className="text-xs text-slate-400">{order.symbol}</div>
                </td>
                <td>{order.desk}</td>
                <td>
                  <div className="text-sm text-slate-200">
                    {order.filled.toLocaleString()} / {order.quantity.toLocaleString()}
                  </div>
                </td>
                <td>
                  <span
                    className={`badge ${
                      order.status === 'Hedged'
                        ? 'badge-success'
                        : order.status === 'Rejected'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section-card">
        <div className="section-title">Audit Trail Snapshots</div>
        <div className="grid gap-4 md:grid-cols-2">
          {auditLog.slice(0, 4).map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
              <div className="text-sm font-semibold text-white">{entry.action}</div>
              <div className="text-xs text-slate-400">{formatDate(entry.createdAt)} • {entry.actor}</div>
              <p className="mt-2 text-sm text-slate-200">{entry.metadata}</p>
              <div className="mt-1 text-xs text-slate-500">Entity {entry.entity} • {entry.ip}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
