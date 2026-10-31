import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center rounded-[4px] px-2 py-0.5 text-xs font-medium border transition-colors select-none',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-sunken text-ink border-line',
        brand: 'bg-brand-soft text-brand border-brand/20',
        success: 'bg-verdict-pass-bg text-verdict-pass-fg border-verdict-pass-line',
        danger: 'bg-verdict-fail-bg text-verdict-fail-fg border-verdict-fail-line',
        warning: 'bg-verdict-unc-bg text-verdict-unc-fg border-verdict-unc-line',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

export function Chip({ className, variant, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ variant }), className)} {...props} />;
}
