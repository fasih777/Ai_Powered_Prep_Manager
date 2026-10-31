import { requireRole } from '@/lib/auth/session';
import { ForbiddenState } from '@/components/states/ForbiddenState';

export default async function AuditLogPage() {
  const auth = await requireRole(['reviewer', 'manager']);
  if (!auth.authorized) {
    return (
      <ForbiddenState
        message="You don't have access to this page. Ask a manager to change your role."
        homeRoute="/review/new"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Audit log</h1>
        <p className="text-sm text-ink-muted">
          Immutable, append-only record of all compliance decisions and human overrides.
        </p>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-6">
        <p className="text-sm text-ink-muted">
          Audit trail table and details drawer will be built in Phase F5.
        </p>
      </div>
    </div>
  );
}
