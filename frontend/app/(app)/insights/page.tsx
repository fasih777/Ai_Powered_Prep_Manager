import { requireRole } from '@/lib/auth/session';
import { ForbiddenState } from '@/components/states/ForbiddenState';

export default async function InsightsPage() {
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
        <h1 className="text-2xl font-bold tracking-tight text-ink">Insights</h1>
        <p className="text-sm text-ink-muted">
          Quality trends, verdict distribution, and compliance failure rates.
        </p>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-6">
        <p className="text-sm text-ink-muted">
          Insights analytics and Recharts visualizations will be built in Phase F6.
        </p>
      </div>
    </div>
  );
}
