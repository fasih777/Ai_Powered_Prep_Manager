import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthContext, getNextPath } from '@/lib/auth/session';
import { AppShell } from '@/components/shell/AppShell';
import { ForbiddenState } from '@/components/states/ForbiddenState';

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();

  if (auth.status === 'unauthenticated') {
    redirect(`/login${getNextPath()}`);
  }

  if (auth.status === 'forbidden' || !auth.session) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <ForbiddenState
          message={auth.reason || "Your account is not assigned to an active organization or has an unrecognized role."}
          homeRoute="/login"
        />
      </div>
    );
  }

  const session = auth.session;
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
