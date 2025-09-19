const toggles = [
  { label: "Enable SSO enforcement", description: "Require SAML SSO for all workspace members", enabled: true },
  {
    label: "Auto-approve dealer quotes",
    description: "Allow spreads under policy threshold to auto execute",
    enabled: false
  },
  {
    label: "Nightly exposure digest",
    description: "Send condensed summary to leadership distribution list",
    enabled: true
  }
];

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-text">Workspace settings</h1>
        <p className="text-sm text-text/70">Configure authentication, automations, and communications.</p>
      </div>
      <div className="space-y-4">
        {toggles.map((item) => (
          <label
            key={item.label}
            className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text">{item.label}</p>
                <p className="text-xs text-text/60">{item.description}</p>
              </div>
              <span
                className={`inline-flex h-6 w-12 items-center rounded-full border border-white/10 bg-black/40 px-1 ${
                  item.enabled ? "justify-end" : "justify-start"
                }`}
              >
                <span className={`h-4 w-4 rounded-full ${item.enabled ? "bg-accent" : "bg-white/30"}`} />
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-text/40">
              {item.enabled ? "Active" : "Paused"}
            </span>
          </label>
        ))}
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-text/70">
        Need deeper controls? Extend Portal via API tokens to sync approvals from your internal systems.
      </div>
    </div>
  );
}
