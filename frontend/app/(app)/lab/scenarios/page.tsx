import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { ScenariosLabView } from '@/components/lab/ScenariosLabView';

export default async function ScenariosLabPage() {
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
        <h1 className="text-xl font-bold text-ink">Scenario Simulator</h1>
        <p className="text-sm text-ink-muted">
          Offline scenario testing with local rule engine evaluation.
        </p>
      </div>
      <ScenariosLabView />
    </div>
  );
}
