import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { BarcodeCoverageEngine } from '@/components/lab/BarcodeCoverageEngine';

export default async function BarcodeLabPage() {
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
        <h1 className="text-xl font-bold text-ink">Barcode Coverage & IoU Engine</h1>
        <p className="text-sm text-ink-muted">
          Analyze FNSKU label placement and manufacturer barcode occlusion.
        </p>
      </div>
      <BarcodeCoverageEngine />
    </div>
  );
}
