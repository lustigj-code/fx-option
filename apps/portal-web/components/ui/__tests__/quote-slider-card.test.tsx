import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import type { MarketDataSnapshot } from '@/lib/market-data';
import type { PremiumCurvePoint, QuoteResult } from '@/lib/quote-pricing';
import { QuoteSliderCard } from '../quote-slider-card';

function render(element: any) {
  return renderToStaticMarkup(element);
}

const baseProps = {
  dealer: 'Acme Dealer',
  currencyPair: 'USD/MXN',
  midRate: 17.42,
  spreadBps: 22
};

test('QuoteSliderCard renders loading status while awaiting market data', () => {
  const html = render(<QuoteSliderCard {...baseProps} />);
  assert(html.includes('Connecting to pricing gateway'));
  assert(html.includes('Loading latest market data'));
});

test('QuoteSliderCard displays gateway error banner when pricing fails', () => {
  const snapshot: MarketDataSnapshot = {
    spotRate: 17.42,
    tenorDays: 30,
    volatility: 0.18,
    domesticRate: 0.04,
    foreignRate: 0.02,
    timestamp: Date.now()
  };
  const quote: QuoteResult = {
    premiumPct: 1.85,
    premiumAmount: 92500,
    forwardRate: 17.5,
    breakEvenRate: 17.64
  };
  const curve: PremiumCurvePoint[] = [
    { offset: 0, premiumPct: 1.5 },
    { offset: 5, premiumPct: 1.85 },
    { offset: 10, premiumPct: 2.1 }
  ];

  const html = render(
    <QuoteSliderCard
      {...baseProps}
      testingState={{
        marketData: snapshot,
        quote,
        curve,
        sliderValue: 5,
        latency: 87.5,
        error: 'Gateway unavailable — retrying'
      }}
    />
  );

  assert(html.includes('Gateway unavailable — retrying'));
  assert(html.includes('87.5 ms'));
  assert(html.includes('Send to bank'));
});
