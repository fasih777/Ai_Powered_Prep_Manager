import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div className="w-full">
        <input
          id={id}
          type={type}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            'flex h-11 w-full rounded-[4px] border border-line bg-surface px-3 py-2 text-base text-ink transition-colors',
            'placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]',
            error && 'border-verdict-fail-line focus-visible:ring-verdict-fail-fg',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-verdict-fail-fg" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
