'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  requestId?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = "Couldn't load this content. Check your connection and try again.",
  requestId,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-surface-sunken border border-line mb-4">
        <AlertTriangle className="h-6 w-6 text-ink-muted" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-ink mb-1">{title}</h2>
      <p className="max-w-md text-sm text-ink-muted mb-4">{message}</p>
      {requestId && (
        <p className="text-xs font-mono text-ink-muted mb-4">
          Request ID: {requestId}
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  );
}
