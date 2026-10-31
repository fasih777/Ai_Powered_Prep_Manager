import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { getHomeRouteForRole } from '@/lib/auth/roles';

export default async function RootPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  const destination = getHomeRouteForRole(session.role);
  redirect(destination);
}
