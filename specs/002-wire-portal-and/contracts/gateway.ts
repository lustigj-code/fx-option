import { z } from 'next/dist/compiled/zod';

const positiveDecimal = z.coerce.number().gt(0, 'must be greater than 0');
const nonNegativeDecimal = z.coerce.number().min(0, 'must be >= 0');
const integerId = z.coerce.number().int();
const isoDate = z.coerce.date();
const isoDateTime = z.coerce.date();
const currencyPairSchema = z
  .string()
  .min(3)
  .transform((value: string) => value.replace('/', '').toUpperCase());
const sideSchema = z.string().min(3).transform((value: string) => value.toLowerCase());
const orderSideSchema = z.string().min(3).transform((value: string) => value.toUpperCase());
const optionRightSchema = z
  .string()
  .min(1)
  .transform((value: string) => {
    const upper = value.toUpperCase();
    return upper === 'P' ? 'PUT' : upper === 'C' ? 'CALL' : upper;
  });

export const marketDataPayloadSchema = z.object({
  spot: positiveDecimal,
  implied_volatility: nonNegativeDecimal,
  interest_rate: z.coerce.number(),
});

export const bindingQuoteRequestSchema = z.object({
  id: z.string().min(1),
  currency_pair: z.string().min(3),
  notional: positiveDecimal,
  strike: positiveDecimal,
  tenor_days: z.coerce.number().int().gt(0),
  market_data: marketDataPayloadSchema,
});

export const quoteMessageSchema = z.object({
  exposure_id: z.string().min(1),
  price: positiveDecimal,
  valid_until: isoDateTime,
});

export const bindingQuoteResponseSchema = z.object({
  exposure_id: z.string().min(1),
  price: positiveDecimal,
  pricing_model: z.string().min(1),
  valid_until: isoDateTime,
  implied_volatility: nonNegativeDecimal,
  cap: nonNegativeDecimal,
  safety_buffer_seconds: z.coerce.number().int().min(0),
  latency_ms: z.coerce.number().min(0),
  downstream_event: quoteMessageSchema.optional().nullable(),
});

export const quoteInputSchema = z.object({
  pair: currencyPairSchema,
  spot: z.coerce.number(),
  volatility: z.coerce.number(),
});

export const positionInputSchema = z.object({
  pair: currencyPairSchema,
  expiry: isoDate,
  side: sideSchema,
  delta: z.coerce.number(),
  k_distribution: z.record(z.coerce.number()).optional(),
});

export const riskPlanRequestSchema = z.object({
  quotes: z.array(quoteInputSchema),
  exposures: z.array(positionInputSchema),
  hedges: z.array(positionInputSchema).optional().default([]),
});

export const riskBucketSchema = z.object({
  pair: z.string().min(3),
  week_start: isoDate,
  week_end: isoDate,
  pre_delta: z.coerce.number(),
  post_delta: z.coerce.number(),
  pre_var: z.coerce.number(),
  post_var: z.coerce.number(),
  distribution: z.record(z.coerce.number()),
  delta_reduction_pct: z.coerce.number(),
  var_reduction_pct: z.coerce.number(),
  average_tenor_days: z.coerce.number().int(),
});

export const nettingSavingsSchema = z.object({
  delta: z.coerce.number(),
  var: z.coerce.number(),
  delta_pct: z.coerce.number(),
  var_pct: z.coerce.number(),
});

export const riskPlanResponseSchema = z.object({
  buckets: z.array(riskBucketSchema),
  execution_plan: z.array(z.record(z.unknown())),
  netting_savings: nettingSavingsSchema,
});

export const executionOrderRequestSchema = z.object({
  due_date: isoDate,
  quantity: z.coerce.number().int().gt(0),
  side: orderSideSchema,
  strike: positiveDecimal,
  right: optionRightSchema,
  limit_price: positiveDecimal,
  slippage: nonNegativeDecimal.default(0),
  ladder_layers: z.coerce.number().int().gt(0).default(1),
  strike_step: positiveDecimal.default(0.0025),
  expiry_count: z.coerce.number().int().gt(0).default(2),
  account: z.string().optional().nullable(),
  client_order_id: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).default({}),
  dry_run: z.boolean().optional().default(true),
});

export const executionOrderItemSchema = z.object({
  contract_month: isoDate,
  strike: z.coerce.number(),
  right: z.string(),
  quantity: z.coerce.number().int(),
  side: z.string(),
  limit_price: z.coerce.number(),
  status: z.string(),
  ib_order_id: integerId.optional().nullable(),
  client_order_id: z.string().optional().nullable(),
  account: z.string().optional().nullable(),
  submitted_at: isoDateTime.optional().nullable(),
  acknowledged_at: isoDateTime.optional().nullable(),
  fills: z.array(z.record(z.unknown())),
});

export const hedgePlacedSchema = z.object({
  timestamp: isoDateTime,
  side: z.string(),
  quantity: z.coerce.number().int(),
  ladder_layers: z.coerce.number().int(),
});

export const executionResponseSchema = z.object({
  orders: z.array(executionOrderItemSchema),
  hedge_event: hedgePlacedSchema.optional().nullable(),
});

export type MarketDataPayload = z.infer<typeof marketDataPayloadSchema>;
export type BindingQuoteRequest = z.infer<typeof bindingQuoteRequestSchema>;
export type BindingQuoteResponse = z.infer<typeof bindingQuoteResponseSchema>;
export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type PositionInput = z.infer<typeof positionInputSchema>;
export type RiskPlanRequest = z.infer<typeof riskPlanRequestSchema>;
export type RiskPlanResponse = z.infer<typeof riskPlanResponseSchema>;
export type ExecutionOrderRequest = z.infer<typeof executionOrderRequestSchema>;
export type ExecutionOrderItem = z.infer<typeof executionOrderItemSchema>;
export type ExecutionResponse = z.infer<typeof executionResponseSchema>;
