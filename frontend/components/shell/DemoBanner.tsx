import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoBannerProps {
  source?: string;
  className?: string;
}

export function DemoBanner({ source, className }: DemoBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full bg-verdict-unc-bg border-b border-verdict-unc-line px-4 py-2 text-xs md:text-sm font-medium text-verdict-unc-fg flex items-center justify-center gap-2 select-none',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Demo data. These results are not real compliance decisions.
        {source && <span className="opacity-80 ml-1">({source})</span>}
      </span>
    </div>
  );
}
