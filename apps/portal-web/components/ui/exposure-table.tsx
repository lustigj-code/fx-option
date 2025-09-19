import { ReactNode } from "react";

export type Exposure = {
  currencyPair: string;
  netExposure: string;
  hedged: string;
  status: "covered" | "warning" | "critical";
  updatedAt: string;
};

const statusStyles: Record<Exposure["status"], string> = {
  covered: "bg-emerald-500/10 text-emerald-300",
  warning: "bg-amber-500/10 text-amber-200",
  critical: "bg-rose-500/10 text-rose-200"
};

const statusCopy: Record<Exposure["status"], ReactNode> = {
  covered: "On Track",
  warning: "Rebalance Soon",
  critical: "Immediate Action"
};

export function ExposureTable({ rows }: { rows: Exposure[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
      <table className="min-w-full divide-y divide-white/5 text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-text/60">
          <tr>
            <th scope="col" className="px-6 py-4">
              Pair
            </th>
            <th scope="col" className="px-6 py-4">
              Net Exposure
            </th>
            <th scope="col" className="px-6 py-4">
              Hedged %
            </th>
            <th scope="col" className="px-6 py-4">
              Status
            </th>
            <th scope="col" className="px-6 py-4">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-text/80">
          {rows.map((exposure) => (
            <tr key={exposure.currencyPair} className="hover:bg-white/5">
              <td className="px-6 py-4 font-semibold text-text">
                {exposure.currencyPair}
              </td>
              <td className="px-6 py-4">{exposure.netExposure}</td>
              <td className="px-6 py-4">{exposure.hedged}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[exposure.status]}`}
                >
                  {statusCopy[exposure.status]}
                </span>
              </td>
              <td className="px-6 py-4 text-text/60">{exposure.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
