import { ExposureTable, type Exposure } from "@/components/ui/exposure-table";

const data: Exposure[] = [
  {
    currencyPair: "USD/JPY",
    netExposure: "¥620M",
    hedged: "78%",
    status: "warning",
    updatedAt: "2m ago"
  },
  {
    currencyPair: "EUR/GBP",
    netExposure: "£42M",
    hedged: "92%",
    status: "covered",
    updatedAt: "5m ago"
  },
  {
    currencyPair: "AUD/USD",
    netExposure: "$18M",
    hedged: "61%",
    status: "critical",
    updatedAt: "30s ago"
  },
  {
    currencyPair: "USD/BRL",
    netExposure: "R$75M",
    hedged: "84%",
    status: "warning",
    updatedAt: "11m ago"
  }
];

const insightTiles = [
  { label: "Net cashflow drift", value: "12.4%" },
  { label: "Sensitivity to USD", value: "68.0%" },
  { label: "Policy breaches", value: "2 flags" }
];

export default function ExposuresPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-text">Exposure overview</h1>
        <p className="text-sm text-text/70">Monitor program coverage and identify material FX swings in real time.</p>
      </div>
      <ExposureTable rows={data} />
      <div className="grid gap-6 sm:grid-cols-3">
        {insightTiles.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-widest text-text/50">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-text">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
