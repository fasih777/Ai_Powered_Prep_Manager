'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { Chip } from '@/components/ui/Chip';
import { CanonicalRole } from '@/lib/auth/roles';

interface TopBarProps {
  organizationName?: string;
  appEnv: 'local' | 'staging' | 'production';
  userName: string;
  userEmail: string;
  userRole: CanonicalRole;
}

export function TopBar({
  organizationName = 'ApexPrep Fulfillment',
  appEnv,
  userName,
  userEmail,
  userRole,
}: TopBarProps) {
  const showEnvBadge = appEnv !== 'production';
  const envLabel = appEnv === 'staging' ? 'Staging' : 'Local';

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-line bg-surface px-4 md:px-6">
      {/* Brand & Organization */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-ink hover:text-brand transition-colors"
          aria-label="Prep Manager Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-brand text-on-brand">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:inline-block">
            Prep Manager
          </span>
        </Link>

        <span className="text-line-strong text-lg hidden sm:inline-block">/</span>
        <span className="text-sm font-medium text-ink-muted truncate max-w-[180px] md:max-w-xs">
          {organizationName}
        </span>

        {showEnvBadge && (
          <Chip variant="warning" className="ml-1 text-[11px] font-mono uppercase">
            {envLabel}
          </Chip>
        )}
      </div>

      {/* Controls & User Menu */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="h-5 w-[1px] bg-line mx-1" aria-hidden="true" />
        <UserMenu name={userName} email={userEmail} role={userRole} />
      </div>
    </header>
  );
}
