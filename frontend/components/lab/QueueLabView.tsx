'use client';

import React from 'react';
import { CeleryQueueMonitor } from './CeleryQueueMonitor';

export function QueueLabView() {
  const handleEnqueueJob = async () => {
    try {
      await fetch('/api/v1/prep-review/async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'electronics_small', images: [] }),
      });
    } catch {
      // Dev simulation
    }
  };

  return (
    <div className="space-y-4">
      <CeleryQueueMonitor onEnqueueJob={handleEnqueueJob} />
    </div>
  );
}
