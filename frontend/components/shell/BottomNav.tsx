'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { NavIcon } from './NavIcon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { CanonicalRole, getNavItemsForRole } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  role: CanonicalRole;
  isLabEnabled?: boolean;
}

export function BottomNav({ role, isLabEnabled = false }: BottomNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const allNavItems = getNavItemsForRole(role, isLabEnabled);

  // Enforce max 4 slots total:
  // If role has <= 4 nav items, show them all with no "More".
  // If more than 4, show first 3 plus "More" (opening the Sheet with the rest in Blueprint order).
  const hasOverflow = allNavItems.length > 4;
  const primaryItems = hasOverflow ? allNavItems.slice(0, 3) : allNavItems;
  const overflowItems = hasOverflow ? allNavItems.slice(3) : [];

  const isOverflowActive = overflowItems.some(
    (item) =>
      pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href))
  );

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-line bg-surface px-2 lg:hidden shadow-lg select-none"
      >
        {primaryItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && item.href !== '/rules' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-1 text-xs font-medium transition-colors min-h-[48px]',
                isActive
                  ? 'text-brand font-semibold'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <NavIcon name={item.iconName} className="h-5 w-5 mb-1 shrink-0" />
              <span className="truncate max-w-[80px]">{item.name}</span>
            </Link>
          );
        })}

        {overflowItems.length > 0 && (
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-expanded={isMoreOpen}
            aria-label="Open more navigation options"
            className={cn(
              'flex flex-1 flex-col items-center justify-center py-1 text-xs font-medium transition-colors min-h-[48px]',
              isOverflowActive
                ? 'text-brand font-semibold'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <MoreHorizontal className="h-5 w-5 mb-1 shrink-0" aria-hidden="true" />
            <span>More</span>
          </button>
        )}
      </nav>

      {/* Overflow Sheet */}
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-[16px] max-h-[70vh] overflow-y-auto pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col space-y-2">
            {overflowItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-[6px] px-3 py-3 text-base font-medium transition-colors min-h-[48px]',
                    isActive
                      ? 'bg-brand text-on-brand'
                      : 'text-ink hover:bg-surface-sunken'
                  )}
                >
                  <NavIcon name={item.iconName} className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
