import Link from "next/link";
import { HedgeCard } from "@/components/ui/hedge-card";

const hedges = [
  {
    title: "Quarterly USD program",
    subtitle: "Rolling 3-month ladder hedging against forecasted EUR cashflows.",
    metrics: [
      { label: "Coverage", value: "85%", helper: "Policy target: 80-95%" },
      { label: "VaR impact", value: "-12%" },
      { label: "Next action", value: "Nov 14" }
    ]
  },
  {
    title: "LatAm risk sleeve",
    subtitle: "Dynamic hedging with max slippage enforcement across BRL and MXN.",
    metrics: [
      { label: "Coverage", value: "68%", helper: "Trigger at 65%" },
      { label: "Drift vs plan", value: "+4%" },
      { label: "Alerts", value: "2 open" }
    ]
  }
];

export default function HedgesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-text">Hedge playbooks</h1>
        <p className="text-sm text-text/70">
          Activate and monitor hedge strategies with clear guardrails and escalation rules.
        </p>
      </div>
      <div className="grid gap-6">
        {hedges.map((hedge) => (
          <HedgeCard
            key={hedge.title}
            title={hedge.title}
            subtitle={hedge.subtitle}
            metrics={hedge.metrics}
            action={
              <Link
                href="#"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80"
              >
                View runbook →
              </Link>
            }
          />
        ))}
      </div>
      <div className="rounded-3xl border border-dashed border-accent/40 bg-accent/5 p-6 text-center text-sm text-text/60">
        Need another playbook? Drag in hedging widgets from the library to construct new guardrails in minutes.
      </div>
    </div>
  );
}
