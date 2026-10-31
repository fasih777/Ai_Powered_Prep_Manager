import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ForbiddenStateProps {
  message?: string;
  homeRoute?: string;
}

export function ForbiddenState({
  message = "You don't have access to this page. Ask a manager to change your role.",
  homeRoute = '/review/new',
}: ForbiddenStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-verdict-fail-bg border border-verdict-fail-line mb-4">
        <ShieldAlert className="h-6 w-6 text-verdict-fail-fg" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-ink mb-2">Access restricted</h2>
      <p className="max-w-md text-sm text-ink-muted mb-6">{message}</p>
      <Link href={homeRoute}>
        <Button variant="secondary" size="md">
          Go to home
        </Button>
      </Link>
    </div>
  );
}
