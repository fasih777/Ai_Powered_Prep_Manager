'use client';

import React from 'react';
import { CanonicalRole } from '@/lib/auth/roles';

interface RoleGateProps {
  currentRole: CanonicalRole;
  allow: CanonicalRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({
  currentRole,
  allow,
  children,
  fallback = null,
}: RoleGateProps) {
  if (!allow.includes(currentRole)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
