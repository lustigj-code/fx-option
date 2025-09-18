"use client";

import { useState } from "react";

type QuoteSliderCardProps = {
  dealer: string;
  currencyPair: string;
  midRate: number;
  spreadBps: number;
};

export function QuoteSliderCard({ dealer, currencyPair, midRate, spreadBps }: QuoteSliderCardProps) {
  const [hedgeRatio, setHedgeRatio] = useState(50);
  const impliedRate = (midRate * (1 + (spreadBps / 10000) * (hedgeRatio / 100))).toFixed(4);

  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-soft">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-foreground/50">{dealer}</p>
          <h3 className="text-xl font-semibold text-foreground">{currencyPair}</h3>
        </div>
        <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
          {spreadBps} bps spread
        </span>
      </div>
      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between text-foreground/70">
          <span>Hedge Ratio</span>
          <span className="font-semibold text-foreground">{hedgeRatio}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={hedgeRatio}
          onChange={(event) => setHedgeRatio(Number(event.target.value))}
          className="accent-accent"
        />
        <div className="flex items-center justify-between text-foreground/70">
          <span>Estimated execution</span>
          <span className="font-semibold text-foreground">{impliedRate}</span>
        </div>
      </div>
    </div>
  );
}
