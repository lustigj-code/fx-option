const exportsList = [
  {
    name: "Board summary.pdf",
    frequency: "Weekly",
    lastRun: "Today 07:00",
    status: "Delivered"
  },
  {
    name: "Policy compliance.csv",
    frequency: "Daily",
    lastRun: "Today 05:15",
    status: "Delivered"
  },
  {
    name: "Dealer allocation.xlsx",
    frequency: "Monthly",
    lastRun: "Sep 30",
    status: "Queued"
  }
];

export default function ExportsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Exports &amp; reporting</h1>
        <p className="text-sm text-foreground/70">
          Configure always-fresh packets across PDF, CSV, and XLS to keep stakeholders in the loop.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-foreground/60">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Cadence</th>
              <th className="px-6 py-4">Last run</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-foreground/80">
            {exportsList.map((item) => (
              <tr key={item.name} className="hover:bg-white/5">
                <td className="px-6 py-4 font-semibold text-foreground">{item.name}</td>
                <td className="px-6 py-4">{item.frequency}</td>
                <td className="px-6 py-4">{item.lastRun}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-foreground/70">
        Need to push data into your warehouse? Portal exposes streaming webhooks alongside daily file drops.
      </div>
    </div>
  );
}
