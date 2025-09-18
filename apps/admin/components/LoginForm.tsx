'use client';

import { FormEvent, useState } from 'react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? 'Unable to sign in');
        return;
      }
      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-900/60">
      <div>
        <h1 className="text-2xl font-semibold text-white">FX Option Control Room</h1>
        <p className="text-sm text-slate-400">Operator access requires secure credentials.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium text-slate-200">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className="input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-slate-200">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      <button type="submit" className="button-primary w-full" disabled={loading}>
        {loading ? 'Validating…' : 'Sign in'}
      </button>
      <p className="text-xs text-slate-500">
        Access is limited to authorised trading operations staff. Credentials rotate every 90 days.
      </p>
    </form>
  );
}
