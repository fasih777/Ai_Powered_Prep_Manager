import { requireRole } from '@/lib/auth/session';
import { ForbiddenState } from '@/components/states/ForbiddenState';

interface ReviewDetailPageProps {
  params: { id: string };
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const auth = await requireRole(['operator', 'reviewer', 'manager']);
  if (!auth.authorized) {
    return <ForbiddenState />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Review <span className="font-mono text-xl">{params.id}</span>
        </h1>
        <p className="text-sm text-ink-muted">
          Flagship review inspection and override record.
        </p>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-6">
        <p className="text-sm text-ink-muted">
          Flagship detail screen (VerdictSeal, EvidenceViewer, CheckList) will be built in Phase F4.
        </p>
      </div>
    </div>
  );
}
