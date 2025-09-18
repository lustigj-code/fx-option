import * as React from 'react';

import { Badge } from './Badge';
import { Button } from './Button';
import { cn } from '../lib/utils';

export interface HeroProps extends React.HTMLAttributes<HTMLDivElement> {
  headline: string;
  subheadline: string;
  badges?: string[];
  primaryCta?: { label: string; onClick?: () => void };
  secondaryCta?: { label: string; onClick?: () => void };
  media?: React.ReactNode;
}

export const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  (
    {
      className,
      headline,
      subheadline,
      badges = [],
      primaryCta,
      secondaryCta,
      media,
      ...props
    },
    ref
  ) => (
    <section
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-accent-muted/30 bg-background px-8 py-12 shadow-soft',
        "bg-radial-emerald before:pointer-events-none before:absolute before:inset-0 before:bg-noise-overlay before:opacity-60 before:content-['']",
        className
      )}
      {...props}
    >
      <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center">
        <div className="flex-1 space-y-6">
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <Badge key={badge} tone="accent">
                {badge}
              </Badge>
            ))}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text md:text-5xl">{headline}</h1>
          <p className="max-w-xl text-base text-muted md:text-lg">{subheadline}</p>
          <div className="flex flex-wrap gap-4">
            {primaryCta && <Button onClick={primaryCta.onClick}>{primaryCta.label}</Button>}
            {secondaryCta && (
              <Button variant="ghost" onClick={secondaryCta.onClick}>
                {secondaryCta.label}
              </Button>
            )}
          </div>
        </div>
        {media && <div className="flex-1">{media}</div>}
      </div>
    </section>
  )
);

Hero.displayName = 'Hero';
