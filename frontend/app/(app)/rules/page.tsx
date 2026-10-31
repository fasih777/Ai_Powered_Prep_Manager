import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { ForbiddenState } from '@/components/states/ForbiddenState';

const CATEGORIES = [
  { id: 'electronics_small', name: 'Small Electronics', version: '2026.09.1', checks: 10 },
  { id: 'apparel', name: 'Apparel & Textiles', version: '2026.09.1', checks: 8 },
  { id: 'liquids_consumables', name: 'Liquids & Consumables', version: '2026.09.1', checks: 9 },
  { id: 'fragile_glass', name: 'Fragile & Glass', version: '2026.09.1', checks: 6 },
];

export default async function RulesPage() {
  const auth = await requireRole(['operator', 'reviewer', 'manager']);
  if (!auth.authorized) {
    return <ForbiddenState />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Rules</h1>
        <p className="text-sm text-ink-muted">
          Active versioned packaging compliance rule sets in force.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/rules/${cat.id}`}
            className="rounded-[8px] border border-line bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-surface-sunken"
          >
            <h2 className="text-base font-semibold text-ink">{cat.name}</h2>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-muted font-mono">
              <span>v{cat.version}</span>
              <span>{cat.checks} checks</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
