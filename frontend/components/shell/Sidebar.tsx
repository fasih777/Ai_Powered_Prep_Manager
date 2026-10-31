'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NavIcon } from './NavIcon';
import { Button } from '@/components/ui/Button';
import { CanonicalRole, getNavItemsForRole } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: CanonicalRole;
  isLabEnabled?: boolean;
  initialCollapsed?: boolean;
}

export function Sidebar({
  role,
  isLabEnabled = false,
  initialCollapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const navItems = getNavItemsForRole(role, isLabEnabled);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    document.cookie = `sidebar_collapsed=${nextState}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        'hidden lg:flex flex-col border-r border-line bg-surface transition-all duration-200 select-none sticky top-16 h-[calc(100vh-4rem)]',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Navigation links */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/rules' && item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-brand text-on-brand'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
              )}
            >
              <NavIcon name={item.iconName} className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse/Expand Toggle Footer */}
      <div className="border-t border-line p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="w-full justify-center text-ink-muted hover:text-ink min-h-[36px]"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </div>
          )}
        </Button>
      </div>
    </aside>
  );
}
