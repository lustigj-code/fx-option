'use client';

import { useState } from 'react';

export function TopBar({ username }: { username: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      window.location.href = '/login';
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Control Room</h1>
        <p className="text-sm text-slate-400">Operational oversight of pricing, settlement and risk hedging flows.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
          Signed in as <span className="font-semibold text-white">{username}</span>
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={handleLogout}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  );
}
