"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { Badge, Button } from "ui-kit";

import type { MarketDataSnapshot } from "@/lib/market-data";
import { fetchMarketData } from "@/lib/market-data";
import {
  describeLatency,
  formatCurrency,
  formatPercent,
  generatePremiumCurve,
  type PremiumCurvePoint,
  type QuoteResult
} from "@/lib/quote-pricing";

const DEFAULT_NOTIONAL = 5_000_000;
const CHART_WIDTH = 420;
const CHART_HEIGHT = 180;
const CHART_PADDING = 18;

export type QuoteSliderCardProps = {
  dealer: string;
  currencyPair: string;
  midRate: number;
  spreadBps: number;
};

export function QuoteSliderCard({ dealer, currencyPair, midRate, spreadBps }: QuoteSliderCardProps) {
  const [marketData, setMarketData] = useState<MarketDataSnapshot | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [curve, setCurve] = useState<PremiumCurvePoint[]>([]);
  const [sliderValue, setSliderValue] = useState<number>(5);
  const [latency, setLatency] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSliderValue(parseFloat(event.target.value));
  };

  useEffect(() => {
    let mounted = true;

    fetchMarketData()
      .then((snapshot) => {
        if (mounted) {
          setMarketData(snapshot);
        }
      })
      .catch(() => {
        if (mounted) {
          setMarketData(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!marketData) return;

    const snapshot = marketData;

    let cancelled = false;
    const start = performance.now();

    async function loadQuote() {
      try {
        setError(null);
        const { requestBindingQuote } = await import("@/lib/api");

        const offsetStrike = snapshot.spotRate * (1 + sliderValue / 100);
        const response = await requestBindingQuote({
          id: `demo-${sliderValue.toFixed(1)}`,
          currency_pair: currencyPair,
          notional: DEFAULT_NOTIONAL,
          strike: offsetStrike,
          tenor_days: snapshot.tenorDays,
          market_data: {
            spot: snapshot.spotRate,
            implied_volatility: snapshot.volatility,
            interest_rate: snapshot.domesticRate
          }
        });

        if (cancelled) return;

        const priceValue = typeof response.price === "string" ? Number(response.price) : response.price;
        const premiumRatio = priceValue / DEFAULT_NOTIONAL;
        const calcQuote: QuoteResult = {
          premiumPct: +(premiumRatio * 100).toFixed(2),
          premiumAmount: +priceValue.toFixed(2),
          forwardRate: snapshot.spotRate,
          breakEvenRate: +(snapshot.spotRate + premiumRatio).toFixed(6)
        };

        const nextCurve = generatePremiumCurve({
          marketData: snapshot,
          tenorDays: snapshot.tenorDays,
          notional: DEFAULT_NOTIONAL,
          min: 0,
          max: 10,
          resolution: 31
        });

        setQuote(calcQuote);
        setCurve(nextCurve);
        setLatency(performance.now() - start);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to reach pricing service");
        }
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [marketData, sliderValue, currencyPair]);

  const selectedPoint = useMemo(() => {
    if (!curve.length) return null;
    return (
      curve.find((point) => Math.abs(point.offset - sliderValue) < 0.001) ??
      curve.reduce((closest, point) => {
        const currentDelta = Math.abs(point.offset - sliderValue);
        const bestDelta = Math.abs(closest.offset - sliderValue);
        return currentDelta < bestDelta ? point : closest;
      })
    );
  }, [curve, sliderValue]);

  const sparkline = useMemo(() => buildCurvePath(curve), [curve]);
  const highlight = useMemo(() => {
    if (!curve.length || !selectedPoint) return null;
    const { x, y } = projectPoint(selectedPoint, curve);
    return { x, y };
  }, [curve, selectedPoint]);

  if (!marketData || !quote) {
    return (
      <section className="glass-panel relative overflow-hidden rounded-3xl p-8 shadow-glow">
        <div className="noise-overlay absolute inset-0 opacity-60" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Priming invoice engine…
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel relative overflow-hidden rounded-3xl p-8 shadow-glow">
      <div className="noise-overlay absolute inset-0 opacity-60" />
      <div className="relative z-10 flex flex-col gap-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge>{currencyPair}</Badge>
              <Badge>{`${marketData.tenorDays} day tenor`}</Badge>
              <Badge>{dealer}</Badge>
            </div>
            <div>
              <h2 className="text-3xl font-semibold">Invoice premium calibrator</h2>
              <p className="max-w-xl text-sm text-slate-300">
                Slide K to dial protection. We keep the premium curve responsive under 120 ms while displaying the breakeven
                against the live forward.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-right text-xs uppercase tracking-[0.35em] text-emerald-200">
            <span className="block text-[0.65rem] text-emerald-300/80">latency</span>
            <span className="text-base font-semibold tracking-tight text-emerald-100">{latency.toFixed(1)} ms</span>
            <span className="block text-[0.65rem] text-emerald-300/60">{describeLatency(latency)}</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="flex flex-col gap-6">
            {error ? (
              <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            <div className="rounded-3xl border border-white/5 bg-white/5 p-6">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span className="font-medium text-white">K offset</span>
                <span>{sliderValue.toFixed(1)}%</span>
              </div>
              <div className="mt-6">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={sliderValue}
                  onChange={handleRangeChange}
                  onInput={handleRangeChange}
                  className="h-2 w-full appearance-none rounded-full bg-slate-800 accent-emerald-400"
                />
                <div className="relative -mt-2 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="absolute inset-0 h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
                    style={{ width: `${Math.min(100, Math.max(6, (sliderValue / 10) * 100))}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 via-white/2 to-white/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">premium curve</h3>
                <span className="text-xs text-slate-300">{curve.length} samples</span>
              </div>
              <svg
                className="mt-4 w-full"
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                role="img"
                aria-label="Premium curve"
              >
                <defs>
                  <linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(16,185,129,0.35)" />
                    <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                  </linearGradient>
                </defs>
                {sparkline && (
                  <>
                    <path
                      d={`${sparkline} L ${CHART_WIDTH - CHART_PADDING} ${CHART_HEIGHT - CHART_PADDING} L ${CHART_PADDING} ${CHART_HEIGHT - CHART_PADDING} Z`}
                      fill="url(#curveFill)"
                      opacity={0.5}
                    />
                    <path d={sparkline} fill="none" stroke="url(#curveFill)" strokeWidth={3} />
                  </>
                )}
                {highlight && (
                  <g>
                    <circle cx={highlight.x} cy={highlight.y} r={6} fill="#10b981" stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                    <line
                      x1={highlight.x}
                      x2={highlight.x}
                      y1={highlight.y}
                      y2={CHART_HEIGHT - CHART_PADDING}
                      stroke="rgba(148,163,184,0.4)"
                      strokeDasharray="4 6"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 rounded-3xl border border-white/5 bg-white/5 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">premium</p>
                <p className="text-4xl font-semibold text-white">{formatPercent(quote.premiumPct)}</p>
              </div>
              <div className="grid gap-3 text-sm text-slate-300">
                <InfoRow label="Total premium" value={formatCurrency(quote.premiumAmount)} />
                <InfoRow label="Forward rate" value={quote.forwardRate.toFixed(4)} />
                <InfoRow label="Breakeven" value={quote.breakEvenRate.toFixed(4)} />
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className={classNames(
                "relative overflow-hidden text-lg",
                "transition-transform duration-200 hover:-translate-y-0.5"
              )}
            >
              Send to bank
            </Button>
          </div>
        </div>

        <footer className="grid gap-4 rounded-3xl border border-white/5 bg-white/5 p-6 text-sm text-slate-300">
          <InfoRow label="Spot" value={midRate.toFixed(4)} />
          <InfoRow label="Dealer spread" value={`${spreadBps} bps`} />
          <InfoRow label="Market timestamp" value={new Date(marketData.timestamp).toLocaleTimeString()} />
        </footer>
      </div>
    </section>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</span>
    <span className="text-base text-white">{value}</span>
  </div>
);

function buildCurvePath(points: PremiumCurvePoint[]) {
  if (!points.length) return "";
  const min = Math.min(...points.map((p) => p.premiumPct));
  const max = Math.max(...points.map((p) => p.premiumPct));
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const { x, y } = project(point, index, points.length, min, range);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function project(point: PremiumCurvePoint, index: number, length: number, min: number, range: number) {
  const xProgress = length <= 1 ? 0 : index / (length - 1);
  const yProgress = (point.premiumPct - min) / range;
  const x = CHART_PADDING + xProgress * (CHART_WIDTH - CHART_PADDING * 2);
  const y = CHART_HEIGHT - CHART_PADDING - yProgress * (CHART_HEIGHT - CHART_PADDING * 2);
  return { x, y };
}

function projectPoint(target: PremiumCurvePoint, points: PremiumCurvePoint[]) {
  const min = Math.min(...points.map((p) => p.premiumPct));
  const max = Math.max(...points.map((p) => p.premiumPct));
  const range = max - min || 1;
  const index = points.findIndex((point) => point === target);
  return project(target, index === -1 ? 0 : index, points.length, min, range);
}
