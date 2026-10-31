import { requireRole } from '@/lib/auth/session';
import { ForbiddenState } from '@/components/states/ForbiddenState';



export default async function NewReviewPage() {
  const auth = await requireRole(['operator', 'reviewer', 'manager']);
  if (!auth.authorized) {
    return <ForbiddenState />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">New review</h1>
        <p className="text-sm text-ink-muted">
          Capture photos of prepared unit to verify inbound compliance.
        </p>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-6">
        <p className="text-sm text-ink-muted">
          Capture flow (CategoryPicker, PhotoSlot, WorkOrder) will be built in Phase F4.
        </p>
      </div>
    </div>
  );
}
