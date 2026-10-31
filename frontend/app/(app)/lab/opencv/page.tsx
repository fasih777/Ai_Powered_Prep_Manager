import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { OpenCvLabView } from '@/components/lab/OpenCvLabView';

export default async function OpencvLabPage() {
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
        <h1 className="text-xl font-bold text-ink">OpenCV Preprocessing Lab</h1>
        <p className="text-sm text-ink-muted">
          Inspect Laplacian sharpness variance, adaptive binarization, and edge maps.
        </p>
      </div>
      <OpenCvLabView />
    </div>
  );
}
