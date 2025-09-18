import * as React from 'react';

import { Button } from './Button';
import { cn } from '../lib/utils';

export interface NavbarLink {
  label: string;
  href: string;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo: React.ReactNode;
  links?: NavbarLink[];
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, logo, links = [], ctaLabel = 'Get started', onCtaClick, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(
        'flex items-center justify-between rounded-2xl border border-accent-muted/30 bg-card/80 px-6 py-4 shadow-soft backdrop-blur-xl',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 text-sm font-semibold text-text">{logo}</div>
      <div className="hidden items-center gap-6 text-sm text-muted md:flex">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="transition hover:text-text">
            {link.label}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      </div>
    </nav>
  )
);

Navbar.displayName = 'Navbar';
