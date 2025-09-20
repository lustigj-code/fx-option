import { fetchRiskPlan } from './api';

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface ControlRoomEvent {
  id: string;
  createdAt: string;
  type: string;
  message: string;
  severity: EventSeverity;
  source: string;
}

export interface Quote {
  id: string;
  pair: string;
  side: 'Buy' | 'Sell';
  trader: string;
  notional: number;
  price: number;
  status: 'Open' | 'Filled' | 'Expired';
  expiry: string;
}

export interface Payment {
  id: string;
  counterparty: string;
  currency: string;
  amount: number;
  method: 'Wire' | 'Swift' | 'ACH' | 'SEPA';
  status: 'Pending' | 'Settled' | 'Failed';
  updatedAt: string;
  region: string;
}

export interface HedgeOrder {
  id: string;
  symbol: string;
  strategy: 'Spot' | 'Forward' | 'Option';
  side: 'Buy' | 'Sell';
  quantity: number;
  filled: number;
  status: 'Working' | 'Hedged' | 'Partial' | 'Rejected';
  desk: string;
  placedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  metadata: string;
  createdAt: string;
  ip: string;
}

export const events: ControlRoomEvent[] = [
  {
    id: 'evt-9012',
    createdAt: '2024-05-12T08:25:00Z',
    type: 'RFQ',
    message: 'Incoming RFQ for 50M EUR/USD from Lumi Capital',
    severity: 'info',
    source: 'RFQ Engine'
  },
  {
    id: 'evt-9013',
    createdAt: '2024-05-12T08:32:00Z',
    type: 'Payment',
    message: 'US Treasury wire delayed: reference PMT-441',
    severity: 'warning',
    source: 'Payments Orchestrator'
  },
  {
    id: 'evt-9014',
    createdAt: '2024-05-12T08:35:00Z',
    type: 'Hedge',
    message: 'Forward hedge auto-booked for quote QT-2209',
    severity: 'info',
    source: 'Hedge Engine'
  },
  {
    id: 'evt-9015',
    createdAt: '2024-05-12T08:41:00Z',
    type: 'Alert',
    message: 'Rejected fill for order OR-882 (insufficient credit)',
    severity: 'critical',
    source: 'Prime Broker API'
  },
  {
    id: 'evt-9016',
    createdAt: '2024-05-12T08:53:00Z',
    type: 'Audit',
    message: 'Admin role granted to cfo@clientbank.com',
    severity: 'warning',
    source: 'Access Control'
  }
];

const now = new Date();

function minutesFromNow(minutes: number) {
  return new Date(now.getTime() + minutes * 60 * 1000).toISOString();
}

export const quotes: Quote[] = [
  {
    id: 'QT-2207',
    pair: 'EUR/USD',
    side: 'Sell',
    trader: 'Morgan Hart',
    notional: 25000000,
    price: 1.0834,
    status: 'Open',
    expiry: minutesFromNow(4)
  },
  {
    id: 'QT-2208',
    pair: 'GBP/USD',
    side: 'Buy',
    trader: 'Priya Singh',
    notional: 10000000,
    price: 1.2651,
    status: 'Filled',
    expiry: minutesFromNow(-2)
  },
  {
    id: 'QT-2209',
    pair: 'USD/JPY',
    side: 'Sell',
    trader: 'Noah Park',
    notional: 15000000,
    price: 155.42,
    status: 'Open',
    expiry: minutesFromNow(9)
  },
  {
    id: 'QT-2210',
    pair: 'EUR/GBP',
    side: 'Buy',
    trader: 'Chloe Martin',
    notional: 8000000,
    price: 0.8571,
    status: 'Expired',
    expiry: minutesFromNow(-18)
  },
  {
    id: 'QT-2211',
    pair: 'AUD/USD',
    side: 'Buy',
    trader: 'Lucas Chen',
    notional: 5000000,
    price: 0.6614,
    status: 'Open',
    expiry: minutesFromNow(14)
  }
];

export const payments: Payment[] = [
  {
    id: 'PMT-441',
    counterparty: 'Northwind Energy',
    currency: 'USD',
    amount: 12600000,
    method: 'Wire',
    status: 'Pending',
    updatedAt: '2024-05-12T07:58:00Z',
    region: 'US'
  },
  {
    id: 'PMT-442',
    counterparty: 'Aurora Partners',
    currency: 'EUR',
    amount: 6200000,
    method: 'SEPA',
    status: 'Settled',
    updatedAt: '2024-05-12T07:15:00Z',
    region: 'EU'
  },
  {
    id: 'PMT-443',
    counterparty: 'Harbor Holdings',
    currency: 'JPY',
    amount: 1850000000,
    method: 'Swift',
    status: 'Pending',
    updatedAt: '2024-05-12T08:05:00Z',
    region: 'APAC'
  },
  {
    id: 'PMT-444',
    counterparty: 'Zenith Commodities',
    currency: 'GBP',
    amount: 4200000,
    method: 'Wire',
    status: 'Failed',
    updatedAt: '2024-05-12T06:49:00Z',
    region: 'UK'
  }
];

export const hedgeOrders: HedgeOrder[] = [
  {
    id: 'OR-880',
    symbol: 'EURUSD 1M',
    strategy: 'Forward',
    side: 'Sell',
    quantity: 25000000,
    filled: 25000000,
    status: 'Hedged',
    desk: 'London',
    placedAt: '2024-05-12T07:22:00Z'
  },
  {
    id: 'OR-881',
    symbol: 'USDJPY Spot',
    strategy: 'Spot',
    side: 'Buy',
    quantity: 15000000,
    filled: 12000000,
    status: 'Partial',
    desk: 'Singapore',
    placedAt: '2024-05-12T07:59:00Z'
  },
  {
    id: 'OR-882',
    symbol: 'GBPUSD 3M',
    strategy: 'Forward',
    side: 'Sell',
    quantity: 12000000,
    filled: 0,
    status: 'Rejected',
    desk: 'New York',
    placedAt: '2024-05-12T08:38:00Z'
  },
  {
    id: 'OR-883',
    symbol: 'AUDUSD 2W',
    strategy: 'Option',
    side: 'Buy',
    quantity: 5000000,
    filled: 2000000,
    status: 'Working',
    desk: 'Sydney',
    placedAt: '2024-05-12T08:47:00Z'
  }
];

export const auditLog: AuditLogEntry[] = [
  {
    id: 'AUD-9931',
    actor: 'sara@fxoption.com',
    action: 'Updated settlement instructions',
    entity: 'PMT-441',
    metadata: 'Changed nostro account to CITI-US-001',
    createdAt: '2024-05-12T08:21:00Z',
    ip: '10.18.31.8'
  },
  {
    id: 'AUD-9932',
    actor: 'liam@fxoption.com',
    action: 'Manual hedge override',
    entity: 'QT-2209',
    metadata: 'Adjusted hedge ratio from 0.95 to 0.98',
    createdAt: '2024-05-12T08:28:00Z',
    ip: '10.18.31.14'
  },
  {
    id: 'AUD-9933',
    actor: 'auditor@clientbank.com',
    action: 'Viewed payment details',
    entity: 'PMT-444',
    metadata: 'Read-only access granted via audit mode',
    createdAt: '2024-05-12T08:33:00Z',
    ip: '10.18.32.5'
  },
  {
    id: 'AUD-9934',
    actor: 'priya@fxoption.com',
    action: 'RFQ expiry extension',
    entity: 'QT-2207',
    metadata: 'Expiry moved from 2m to 5m',
    createdAt: '2024-05-12T08:45:00Z',
    ip: '10.18.30.7'
  }
];

export interface RiskBucketSummary {
  pair: string;
  weekStart: string;
  deltaReductionPct: number;
  varReductionPct: number;
}

export interface NettingSavingsSummary {
  delta: number;
  var: number;
  deltaPct: number;
  varPct: number;
}

export interface RiskPlanSummary {
  buckets: RiskBucketSummary[];
  nettingSavings: NettingSavingsSummary;
}

export async function fetchRiskSummary(): Promise<RiskPlanSummary | null> {
  try {
    const quotePayload = quotes.slice(0, 5).map((quote) => ({
      pair: quote.pair.replace('/', ''),
      spot: quote.price,
      volatility: 0.15
    }));

    const exposurePayload = quotes.map((quote) => ({
      pair: quote.pair.replace('/', ''),
      expiry: quote.expiry.split('T')[0],
      side: quote.side.toLowerCase(),
      delta: quote.side === 'Buy' ? quote.notional : -quote.notional
    }));

    const hedgePayload = hedgeOrders.map((order) => ({
      pair: order.symbol.replace('/', ''),
      expiry: order.placedAt.split('T')[0],
      side: order.side.toLowerCase(),
      delta: order.side === 'Buy' ? order.quantity : -order.quantity
    }));

    const plan = await fetchRiskPlan({
      quotes: quotePayload,
      exposures: exposurePayload,
      hedges: hedgePayload
    });

    const buckets = (plan.buckets ?? []).map((bucket) => ({
      pair: String(bucket['pair'] ?? '—'),
      weekStart: String(bucket['week_start'] ?? ''),
      deltaReductionPct: Number(bucket['delta_reduction_pct'] ?? 0),
      varReductionPct: Number(bucket['var_reduction_pct'] ?? 0)
    }));

    const savingsRaw = plan.netting_savings ?? {};
    const nettingSavings: NettingSavingsSummary = {
      delta: Number(savingsRaw['delta'] ?? 0),
      var: Number(savingsRaw['var'] ?? 0),
      deltaPct: Number(savingsRaw['delta_pct'] ?? 0),
      varPct: Number(savingsRaw['var_pct'] ?? 0)
    };

    return { buckets, nettingSavings };
  } catch (error) {
    console.error('Risk summary fetch failed', error);
    return null;
  }
}
