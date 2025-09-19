const partners = [
  "Aurora Bank",
  "Northwind FX",
  "Velocity Markets",
  "Polaris Capital",
  "Atlas Treasury"
];

const kpis = [
  { label: "Coverage automated", value: "92%" },
  { label: "Average spread saved", value: "18 bps" },
  { label: "Time to hedge", value: "<4 min" }
];

const features = [
  {
    title: "Exposure clarity",
    description:
      "Bring every currency cashflow into a single adaptive view with AI assisted tagging and materiality scoring.",
    icon: "📊"
  },
  {
    title: "Dealer collaboration",
    description:
      "Orchestrate RFQs, compare quotes, and trigger programmatic hedges while maintaining full auditability.",
    icon: "🤝"
  },
  {
    title: "Automated policies",
    description:
      "Codify hedge ratios, stop-loss rules, and escalation paths that keep governance satisfied without slowing you down.",
    icon: "⚙️"
  }
];

const livePairs = [
  { pair: "USD/JPY", cadence: "Program hedge cadence", velocity: "1.32x" },
  { pair: "EUR/GBP", cadence: "Program hedge cadence", velocity: "0.87x" },
  { pair: "AUD/USD", cadence: "Event-driven coverage", velocity: "1.08x" },
  { pair: "USD/BRL", cadence: "Dynamic tolerance bands", velocity: "1.54x" }
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-24">
      <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-8 py-16 shadow-soft sm:px-12 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-grid-light [background-size:30px_30px] opacity-20" />
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent">
              <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
              Treasury teams ship faster with FX Portal
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-5xl lg:text-6xl">
                Precision hedging designed for modern treasury desks.
              </h1>
              <p className="max-w-xl text-lg text-text/70">
                Capture exposures in real time, simulate hedge strategies, and execute with confidence using a single
                collaborative workspace purpose built for FX risk owners.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:translate-y-0.5">
                Request access
              </button>
              <button className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-text/80 transition hover:border-accent hover:text-text">
                Explore product tour
              </button>
            </div>
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-2xl bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-widest text-text/50">{kpi.label}</dt>
                  <dd className="mt-2 text-2xl font-semibold text-text">{kpi.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex-1">
            <div className="relative mx-auto max-w-md rounded-[2.5rem] border border-white/10 bg-black/40 p-6 shadow-soft">
              <div className="flex items-center justify-between text-xs text-text/60">
                <span>Live exposures</span>
                <span>Last sync • 28s ago</span>
              </div>
              <div className="mt-6 space-y-4">
                {livePairs.map((item) => (
                  <div key={item.pair} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{item.pair}</p>
                      <p className="text-xs text-text/50">{item.cadence}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">{item.velocity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent p-4 text-sm text-text/70">
                AI assistant is monitoring drift and will alert when hedge window opens.
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 space-y-6" id="company">
          <p className="text-xs uppercase tracking-[0.3em] text-text/50">Trusted by innovative treasury teams</p>
          <div className="grid grid-cols-2 gap-6 text-sm text-text/60 sm:grid-cols-3 md:grid-cols-5">
            {partners.map((partner) => (
              <div key={partner} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-12" id="features">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-text/50">Workflow toolkit</p>
          <h2 className="text-3xl font-semibold text-text sm:text-4xl">Everything a currency program needs in one shell.</h2>
          <p className="text-base text-text/70">
            Connect exposures, hedge mandates, and execution venues into a single programmable platform. Ready out of the box
            with API access and enterprise controls.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-2xl">
                <span aria-hidden="true">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-text">{feature.title}</h3>
              <p className="text-sm text-text/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr]" id="about">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold text-text">A shell that adapts to your program.</h2>
          <p className="text-base text-text/70">
            Modular widgets let you tailor the portal experience across exposures, quotes, hedge playbooks, and reporting. Dark theme is tuned for the late-night desks monitoring global cycles.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-text">Composable analytics</h3>
              <p className="mt-2 text-sm text-text/60">
                Drag charts, sensitivity tiles, and forward curves into custom dashboards that export instantly.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-text">Policy alignment</h3>
              <p className="mt-2 text-sm text-text/60">
                Encode limits and approvals once; reuse across exposures, hedges, and treasury playbooks.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 via-black/20 to-transparent p-8">
          <h3 className="text-xl font-semibold text-text">Launch readiness</h3>
          <ul className="mt-6 space-y-4 text-sm text-text/70">
            <li>✔ Integrate via REST or SFTP connectors</li>
            <li>✔ SOC2 &amp; GDPR controls baked-in</li>
            <li>✔ Single-sign-on ready</li>
            <li>✔ 24/5 follow-the-sun support</li>
          </ul>
          <div className="mt-8 rounded-2xl bg-accent/20 p-4 text-sm text-accent">
            &ldquo;Within weeks we went from spreadsheet chaos to an orchestrated hedging rhythm.&rdquo; — Placeholder CFO quote
          </div>
        </div>
      </section>
    </div>
  );
}
