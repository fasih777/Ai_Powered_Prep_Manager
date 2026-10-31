import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { DemoBanner } from '@/components/shell/DemoBanner';

export default async function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLabEnabled = process.env.NEXT_PUBLIC_ENABLE_LAB === 'true';
  if (!isLabEnabled) {
    notFound();
  }

  const roleAuth = await requireRole(['manager']);
  if (!roleAuth.authorized) {
    notFound();
  }

  return (
    <div className="lab-scope space-y-4">
      <DemoBanner source="Developer Lab Mode (Invariant I3)" />

      {/* Lab Subnavigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2 overflow-x-auto text-sm font-medium">
        <Link
          href="/lab/scenarios"
          className="rounded-[4px] px-3 py-1.5 hover:bg-surface-sunken transition-colors"
        >
          Scenarios
        </Link>
        <Link
          href="/lab/opencv"
          className="rounded-[4px] px-3 py-1.5 hover:bg-surface-sunken transition-colors"
        >
          OpenCV Lab
        </Link>
        <Link
          href="/lab/barcode"
          className="rounded-[4px] px-3 py-1.5 hover:bg-surface-sunken transition-colors"
        >
          Barcode Engine
        </Link>
        <Link
          href="/lab/vlm"
          className="rounded-[4px] px-3 py-1.5 hover:bg-surface-sunken transition-colors"
        >
          VLM Workbench
        </Link>
        <Link
          href="/lab/queue"
          className="rounded-[4px] px-3 py-1.5 hover:bg-surface-sunken transition-colors"
        >
          Celery Queue
        </Link>
      </div>

      <div className="relative">
        {/* Subtle DEMO Watermark (Blueprint §8 S10) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-[4px] bg-verdict-unc-bg border border-verdict-unc-line px-2 py-1 text-xs font-mono font-bold uppercase text-verdict-unc-fg opacity-80"
        >
          DEMO LAB
        </div>

        {children}
      </div>
    </div>
  );
}
