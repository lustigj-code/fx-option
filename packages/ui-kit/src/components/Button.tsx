import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

type ButtonVariant = VariantProps<typeof buttonVariants>;

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-background shadow-soft hover:shadow-glow hover:-translate-y-0.5',
        secondary:
          'bg-card text-text border border-accent-muted/40 hover:border-accent hover:-translate-y-0.5',
        ghost:
          'bg-transparent text-muted hover:text-text hover:bg-accent-muted/30 hover:-translate-y-0.5',
        danger:
          'bg-danger text-background shadow-[0_20px_45px_-25px_rgba(255,77,77,0.35)] hover:shadow-[0_0_25px_0_rgba(255,77,77,0.55)] hover:-translate-y-0.5'
      },
      size: {
        sm: 'px-4 py-2 text-xs',
        md: 'px-5 py-3 text-sm',
        lg: 'px-6 py-3.5 text-base'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariant {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
