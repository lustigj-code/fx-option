import * as React from 'react';

import { Button } from './Button';
import { cn } from '../lib/utils';

export interface FormField {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  helperText?: string;
}

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    { className, title, description, fields, submitLabel = 'Submit', children, ...props },
    ref
  ) => (
    <form
      ref={ref}
      className={cn(
        'space-y-6 rounded-2xl border border-accent-muted/30 bg-card/70 p-6 shadow-soft backdrop-blur-xl',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-2">
          {title && <h3 className="text-xl font-semibold text-text">{title}</h3>}
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      )}
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-2">
            <label htmlFor={field.name} className="text-xs uppercase tracking-wide text-muted">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type ?? 'text'}
              placeholder={field.placeholder}
              className="rounded-2xl border border-accent-muted/40 bg-background/80 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            {field.helperText && <span className="text-xs text-muted">{field.helperText}</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        {children}
        <Button type="submit" className="ml-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
);

Form.displayName = 'Form';
