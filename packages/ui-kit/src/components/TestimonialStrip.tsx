import * as React from 'react';

import { cn } from '../lib/utils';

export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
}

export interface TestimonialStripProps extends React.HTMLAttributes<HTMLDivElement> {
  testimonials: Testimonial[];
  heading?: string;
}

export const TestimonialStrip = React.forwardRef<HTMLDivElement, TestimonialStripProps>(
  ({ className, testimonials, heading = 'Loved by industry leaders', ...props }, ref) => (
    <section ref={ref} className={cn('space-y-6', className)} {...props}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{heading}</h2>
        <div className="h-px flex-1 bg-accent-muted/40 ml-6" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.quote}
            className="glass-card rounded-2xl border border-accent-muted/30 p-4 text-sm text-muted shadow-soft"
          >
            <p className="text-base text-text">“{testimonial.quote}”</p>
            <div className="mt-4 text-xs uppercase tracking-wide text-muted">
              <span className="text-text">{testimonial.author}</span>
              {testimonial.role && <span className="text-muted"> · {testimonial.role}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
);

TestimonialStrip.displayName = 'TestimonialStrip';
