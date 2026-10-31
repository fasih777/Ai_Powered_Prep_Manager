import { requireRole } from '@/lib/auth/session';
import { ForbiddenState } from '@/components/states/ForbiddenState';

export default async function ReviewsListPage() {
  const auth = await requireRole(['operator', 'reviewer', 'manager']);
  if (!auth.authorized) {
    return <ForbiddenState />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reviews</h1>
        <p className="text-sm text-ink-muted">
          Searchable compliance history and inspection records.
        </p>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-6">
        <p className="text-sm text-ink-muted">
          Review history list (FilterBar, ReviewTable, pagination) will be built in Phase F5.
        </p>
      </div>
    </div>
  );
}
