import type { MarketDataSnapshot } from "./market-data";

export interface QuoteRequest {
  notional: number;
  strikeOffsetPct: number;
  tenorDays: number;
  marketData: MarketDataSnapshot;
}

export interface QuoteResult {
  premiumPct: number;
  premiumAmount: number;
  forwardRate: number;
  breakEvenRate: number;
}

export interface PremiumCurvePoint {
  offset: number;
  premiumPct: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function priceQuote(request: QuoteRequest): QuoteResult {
  const { marketData, strikeOffsetPct, tenorDays, notional } = request;

  const coverageRatio = 1 + strikeOffsetPct / 100;
  const forwardCarry = (marketData.domesticRate - marketData.foreignRate) * (tenorDays / 360);
  const forwardRate = marketData.spotRate * (1 + forwardCarry);

  const tenorScale = Math.sqrt(tenorDays / 365);
  const basePremium = 0.01 + marketData.volatility * 0.035;
  const markup = strikeOffsetPct * 0.00045;
  const convexity = Math.pow(strikeOffsetPct - 4.5, 2) * 0.00009 * (1 + tenorScale * 0.3);

  const premiumRatio = clamp((basePremium + markup + convexity) * coverageRatio, 0.005, 0.032);
  const premiumPct = +(premiumRatio * 100).toFixed(2);
  const premiumAmount = +(notional * premiumRatio).toFixed(2);
  const breakEvenRate = +(forwardRate * (1 + premiumRatio)).toFixed(6);

  return {
    premiumPct,
    premiumAmount,
    forwardRate: +forwardRate.toFixed(6),
    breakEvenRate
  };
}

interface CurveOptions {
  marketData: MarketDataSnapshot;
  tenorDays: number;
  notional: number;
  resolution?: number;
  min?: number;
  max?: number;
}

export function generatePremiumCurve({
  marketData,
  tenorDays,
  notional,
  resolution = 21,
  min = 0,
  max = 10
}: CurveOptions): PremiumCurvePoint[] {
  const step = (max - min) / (resolution - 1);
  const points: PremiumCurvePoint[] = [];

  for (let i = 0; i < resolution; i += 1) {
    const offset = +(min + step * i).toFixed(2);
    const quote = priceQuote({ marketData, tenorDays, notional, strikeOffsetPct: offset });
    points.push({ offset, premiumPct: quote.premiumPct });
  }

  return points;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function describeLatency(latency: number) {
  if (latency < 40) return "instant";
  if (latency < 80) return "snappy";
  if (latency < 120) return "desk-ready";
  return "review";
}
