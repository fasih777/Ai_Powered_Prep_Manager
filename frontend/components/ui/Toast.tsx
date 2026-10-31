'use client';

import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export function Toast() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className:
          '!bg-surface !text-ink !border !border-line !shadow-overlay !rounded-[8px] !font-sans !p-4',
        descriptionClassName: '!text-ink-muted !text-sm',
      }}
    />
  );
}
