const RECENT_ACTIVITY = [
  {
    bank: 'Emerald National',
    timestamp: '2m ago',
    currencyPair: 'USD → EUR',
    premiumPct: 1.62,
    status: 'Awaiting confirmation'
  },
  {
    bank: 'Helios Partners',
    timestamp: '18m ago',
    currencyPair: 'GBP → USD',
    premiumPct: 1.94,
    status: 'Sent to bank'
  },
  {
    bank: 'Zürich Clearing',
    timestamp: '39m ago',
    currencyPair: 'SGD → JPY',
    premiumPct: 2.11,
    status: 'Settled'
  }
];

const SentToBankCard = () => {
  return (
    <section className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-lg">
      <div className="noise-overlay absolute inset-0 opacity-60" />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-400/60">sent to bank</p>
            <h2 className="text-2xl font-semibold">Recent handoffs</h2>
          </div>
          <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Auto-tracked
          </span>
        </div>

        <div className="space-y-4">
          {RECENT_ACTIVITY.map((activity) => (
            <article
              key={`${activity.bank}-${activity.timestamp}`}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              <div className="space-y-1">
                <p className="font-medium text-white">{activity.bank}</p>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{activity.timestamp}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-300">{activity.currencyPair}</p>
                <p className="text-xs text-slate-400">Premium {activity.premiumPct.toFixed(2)}%</p>
                <p className="text-xs text-emerald-200/80">{activity.status}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SentToBankCard;
