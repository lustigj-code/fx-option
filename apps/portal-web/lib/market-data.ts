export interface MarketDataSnapshot {
  spotRate: number;
  tenorDays: number;
  volatility: number;
  domesticRate: number;
  foreignRate: number;
  timestamp: number;
}

const BASE_SNAPSHOT: MarketDataSnapshot = {
  spotRate: 1.0875,
  tenorDays: 30,
  volatility: 0.14,
  domesticRate: 0.02,
  foreignRate: 0.01,
  timestamp: Date.now()
};

type Listener = (snapshot: MarketDataSnapshot) => void;

const listeners = new Set<Listener>();

function jitter(value: number, intensity: number) {
  return value + (Math.random() - 0.5) * intensity;
}

export async function fetchMarketData(): Promise<MarketDataSnapshot> {
  try {
    const { requestBindingQuote } = await import('./api');
    await requestBindingQuote({
      id: 'demo-exposure',
      currency_pair: 'USD/MXN',
      notional: 1_000_000,
      strike: BASE_SNAPSHOT.spotRate,
      tenor_days: BASE_SNAPSHOT.tenorDays,
      market_data: {
        spot: BASE_SNAPSHOT.spotRate,
        implied_volatility: BASE_SNAPSHOT.volatility,
        interest_rate: BASE_SNAPSHOT.domesticRate
      }
    });
    return {
      spotRate: BASE_SNAPSHOT.spotRate,
      tenorDays: BASE_SNAPSHOT.tenorDays,
      volatility: BASE_SNAPSHOT.volatility,
      domesticRate: BASE_SNAPSHOT.domesticRate,
      foreignRate: BASE_SNAPSHOT.foreignRate,
      timestamp: Date.now()
    };
  } catch {
    return { ...BASE_SNAPSHOT, timestamp: Date.now() };
  }
}

export function subscribeToMarketData(listener: Listener) {
  listeners.add(listener);
  listener({ ...BASE_SNAPSHOT, timestamp: Date.now() });

  const interval = window.setInterval(() => {
    const next: MarketDataSnapshot = {
      spotRate: jitter(BASE_SNAPSHOT.spotRate, 0.0008),
      tenorDays: BASE_SNAPSHOT.tenorDays,
      volatility: Math.max(0.1, jitter(BASE_SNAPSHOT.volatility, 0.01)),
      domesticRate: Math.max(0.03, jitter(BASE_SNAPSHOT.domesticRate, 0.002)),
      foreignRate: Math.max(0.012, jitter(BASE_SNAPSHOT.foreignRate, 0.002)),
      timestamp: Date.now()
    };
    listeners.forEach((cb) => cb(next));
  }, 5000);

  return () => {
    window.clearInterval(interval);
    listeners.delete(listener);
  };
}
