import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { QueueLabView } from '@/components/lab/QueueLabView';

export default async function QueueLabPage() {
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
        <h1 className="text-xl font-bold text-ink">Celery / Redis Queue Monitor</h1>
        <p className="text-sm text-ink-muted">
          Real-time task state machine, worker heartbeat, and retry simulation.
        </p>
      </div>
      <QueueLabView />
    </div>
  );
}
