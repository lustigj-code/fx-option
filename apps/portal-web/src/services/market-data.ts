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
  tenorDays: 45,
  volatility: 0.14,
  domesticRate: 0.048,
  foreignRate: 0.018,
  timestamp: Date.now()
};

type Listener = (snapshot: MarketDataSnapshot) => void;

const listeners = new Set<Listener>();

function jitter(value: number, intensity: number) {
  return value + (Math.random() - 0.5) * intensity;
}

export async function fetchMarketData(): Promise<MarketDataSnapshot> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      resolve({ ...BASE_SNAPSHOT, timestamp: Date.now() });
    });
  });
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
