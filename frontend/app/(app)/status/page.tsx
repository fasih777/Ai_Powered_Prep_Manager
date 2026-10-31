import { requireRole } from '@/lib/auth/session';
import { ForbiddenState } from '@/components/states/ForbiddenState';

export default async function SystemStatusPage() {
  const auth = await requireRole(['manager']);
  if (!auth.authorized) {
    return (
      <ForbiddenState
        message="You don't have access to this page. Ask a manager to change your role."
        homeRoute={auth.session?.role === 'reviewer' ? '/queue' : '/review/new'}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">System status</h1>
        <p className="text-sm text-ink-muted">
          Health of API, queue (Redis), workers, vision model, and database.
        </p>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-6">
        <p className="text-sm text-ink-muted">
          System status rows with 15s refresh will be built in Phase F6.
        </p>
      </div>
    </div>
  );
}
