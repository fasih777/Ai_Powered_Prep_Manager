'use client';

import React from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Toast } from '@/components/ui/Toast';
import { CanonicalRole } from '@/lib/auth/roles';

interface AppShellProps {
  userRole: CanonicalRole;
  userName: string;
  userEmail: string;
  organizationName?: string;
  appEnv: 'local' | 'staging' | 'production';
  isLabEnabled?: boolean;
  initialSidebarCollapsed?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  userRole,
  userName,
  userEmail,
  organizationName,
  appEnv,
  isLabEnabled = false,
  initialSidebarCollapsed = false,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans">
      <TopBar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        organizationName={organizationName}
        appEnv={appEnv}
      />

      <div className="flex flex-1">
        <Sidebar
          role={userRole}
          isLabEnabled={isLabEnabled}
          initialCollapsed={initialSidebarCollapsed}
        />

        <main id="main" tabIndex={-1} className="flex-1 pb-20 lg:pb-8 focus:outline-none">
          <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav role={userRole} isLabEnabled={isLabEnabled} />
      <Toast />
    </div>
  );
}
