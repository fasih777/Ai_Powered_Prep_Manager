import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth/session';
import { AppShell } from '@/components/shell/AppShell';

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const cookieStore = cookies();
  const sidebarCollapsed = cookieStore.get('sidebar_collapsed')?.value === 'true';
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV as 'local' | 'staging' | 'production') ?? 'local';
  const isLabEnabled = process.env.NEXT_PUBLIC_ENABLE_LAB === 'true';

  return (
    <AppShell
      userName={session.name}
      userEmail={session.email}
      userRole={session.role}
      appEnv={appEnv}
      isLabEnabled={isLabEnabled}
      initialSidebarCollapsed={sidebarCollapsed}
    >
      {children}
    </AppShell>
  );
}
