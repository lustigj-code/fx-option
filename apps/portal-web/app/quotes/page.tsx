import { QuoteSliderCard } from "@/components/ui/quote-slider-card";

const quotes = [
  { dealer: "Aurora Bank", currencyPair: "USD/JPY", midRate: 148.32, spreadBps: 12 },
  { dealer: "Velocity Markets", currencyPair: "EUR/GBP", midRate: 0.8675, spreadBps: 9 },
  { dealer: "Polaris Capital", currencyPair: "AUD/USD", midRate: 0.6432, spreadBps: 15 }
];

export default function QuotesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-text">Live RFQs</h1>
        <p className="text-sm text-text/70">
          Simulate hedge ratios against dealer spreads and capture the best-fit execution without leaving the workspace.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {quotes.map((quote) => (
          <QuoteSliderCard key={quote.dealer} {...quote} />
        ))}
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-text">Auto-execution window</h2>
        <p className="mt-2 text-sm text-text/70">
          Program the spread tolerance, size tiers, and allocation logic, then let Portal manage the orchestration with your
          counterparties.
        </p>
      </div>
    </div>
  );
}
