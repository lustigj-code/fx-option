import { ReactNode } from "react";

type HedgeCardProps = {
  title: string;
  subtitle: string;
  metrics: { label: string; value: string; helper?: ReactNode }[];
  action?: ReactNode;
};

export function HedgeCard({ title, subtitle, metrics, action }: HedgeCardProps) {
  return (
    <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-foreground/60">{subtitle}</p>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-black/20 p-4">
              <dt className="text-xs uppercase tracking-widest text-foreground/50">{metric.label}</dt>
              <dd className="mt-2 text-xl font-semibold text-foreground">{metric.value}</dd>
              {metric.helper ? <div className="mt-1 text-xs text-foreground/60">{metric.helper}</div> : null}
            </div>
          ))}
        </dl>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
