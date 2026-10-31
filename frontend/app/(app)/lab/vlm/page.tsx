import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { VlmLabView } from '@/components/lab/VlmLabView';

export default async function VlmLabPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_LAB !== 'true') {
    notFound();
  }

  const roleAuth = await requireRole(['manager']);
  if (!roleAuth.authorized) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink">VLM Context & Prompt Workbench</h1>
        <p className="text-sm text-ink-muted">
          Inspect VLM prompt templates, documentation embeddings, and sandbox extraction.
        </p>
      </div>
      <VlmLabView />
    </div>
  );
}
