import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none rounded-[4px]',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand hover:bg-brand-hover',
        secondary: 'bg-surface text-ink border border-line hover:bg-surface-sunken',
        ghost: 'bg-transparent text-ink hover:bg-surface-sunken',
        danger: 'bg-verdict-fail-fg text-surface hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 text-sm min-h-[36px]',
        md: 'h-11 px-4 text-base min-h-[44px]',
        lg: 'h-12 px-6 text-base min-h-[48px]',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
