import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[4px] bg-surface-sunken motion-safe:animate-pulse motion-reduce:animate-none',
        className
      )}
      {...props}
    />
  );
}
