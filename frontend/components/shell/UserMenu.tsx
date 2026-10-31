'use client';

import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { CanonicalRole } from '@/lib/auth/roles';

interface UserMenuProps {
  name: string;
  email: string;
  role: CanonicalRole;
}

export function UserMenu({ name, email, role }: UserMenuProps) {
  const roleVariant =
    role === 'manager' ? 'brand' : role === 'reviewer' ? 'warning' : 'neutral';

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-sunken border border-line text-xs font-semibold text-ink">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-ink md:inline-block max-w-[120px] truncate">
            {name}
          </span>
          <Chip variant={roleVariant} className="capitalize">
            {role}
          </Chip>
        </Button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 w-56 rounded-[8px] border border-line bg-surface p-2 text-ink shadow-overlay"
        >
          <div className="px-2 py-1.5 border-b border-line mb-1">
            <p className="text-sm font-semibold text-ink truncate">{name}</p>
            <p className="text-xs text-ink-muted truncate">{email}</p>
          </div>

          <DropdownMenuPrimitive.Item
            className="flex cursor-pointer items-center rounded-[4px] px-2 py-2 text-sm text-verdict-fail-fg outline-none hover:bg-verdict-fail-bg focus:bg-verdict-fail-bg"
            onSelect={() => {
              window.location.href = '/login';
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
