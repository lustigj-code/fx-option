import QuoteSliderCard from './components/QuoteSliderCard';
import SentToBankCard from './components/SentToBankCard';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030508] via-[#05080f] to-[#07121a] text-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_45%)]" />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12 lg:py-16">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400/80">Portal Invoice Flow</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Price, send and accept FX option invoices in one motion.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Tune your protection with precision and hand off to banking partners instantly. The emerald desk keeps the
            curve primed in under 120&nbsp;ms for every move.
          </p>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.85fr,1fr]">
          <QuoteSliderCard />
          <div className="flex flex-col gap-6">
            <SentToBankCard />
            <div className="glass-panel relative overflow-hidden rounded-3xl p-6">
              <div className="noise-overlay absolute inset-0 opacity-60" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-semibold">Why the slider?</h3>
                <p className="text-sm text-slate-300">
                  Drag K to increase your knock-in coverage. The curve responds with convexity-aware premium shifts so you
                  always see the breakeven and total invoice impact before committing.
                </p>
                <p className="text-sm text-slate-400">
                  Market feeds refresh 60× a minute. Latency stays glass-smooth with GPU accelerated canvases and memoized
                  math primitives.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
