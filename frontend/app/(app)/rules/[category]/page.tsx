import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { ForbiddenState } from '@/components/states/ForbiddenState';

interface RuleCategoryPageProps {
  params: { category: string };
}

export default async function RuleCategoryDetailPage({ params }: RuleCategoryPageProps) {
  const auth = await requireRole(['operator', 'reviewer', 'manager']);
  if (!auth.authorized) {
    return <ForbiddenState />;
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb (§4.2) */}
      <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
        <Link href="/rules" className="hover:text-brand">
          Rules
        </Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-ink">{params.category}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Rule set: <span className="font-mono text-xl">{params.category}</span>
        </h1>
        <p className="text-sm text-ink-muted">
          Active rule specification and check thresholds.
        </p>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-6">
        <p className="text-sm text-ink-muted">
          Rule checks table (name, description, rule ID, verifiable from photo, min confidence) will be built in Phase F6.
        </p>
      </div>
    </div>
  );
}
