'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routes = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/events', label: 'Events', icon: '🛰️' },
  { href: '/quotes', label: 'Quotes', icon: '💱' },
  { href: '/payments', label: 'Payments', icon: '💸' },
  { href: '/orders', label: 'Orders & Fills', icon: '📈' },
  { href: '/audit', label: 'Audit', icon: '🧾' }
];

export function Sidebar() {
  const pathname = usePathname() ?? '/';

  return (
    <aside className="sidebar">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Control Room</div>
        <div className="mt-2 text-lg font-semibold text-white">FX Option</div>
      </div>
      <nav className="flex flex-col gap-2">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-slate-800/70 font-semibold text-white'
                  : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              <span className="text-lg">{route.icon}</span>
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto text-xs text-slate-500">
        Secure operator access • {new Date().getFullYear()}
      </div>
    </aside>
  );
}
