import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../supabase/server';
import { CanonicalRole, normalizeRole } from './roles';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: CanonicalRole;
  organizationId: string;
}

/**
 * Checks for a local development fake role.
 * Strictly required: NEXT_PUBLIC_APP_ENV === 'local' AND NODE_ENV !== 'production'.
 * Never active in staging or production.
 */
function getDevFakeRole(): CanonicalRole | null {
  const isLocalEnv = process.env.NEXT_PUBLIC_APP_ENV === 'local';
  const isNotProduction = process.env.NODE_ENV !== 'production';

  if (isLocalEnv && isNotProduction && process.env.DEV_FAKE_ROLE) {
    return normalizeRole(process.env.DEV_FAKE_ROLE);
  }
  return null;
}

export async function getServerSession(): Promise<UserSession | null> {
  const devRole = getDevFakeRole();
  if (devRole) {
    return {
      userId: '00000000-0000-0000-0000-000000000001',
      email: `dev-${devRole}@prep-manager.internal`,
      name: `Dev ${devRole.charAt(0).toUpperCase() + devRole.slice(1)}`,
      role: devRole,
      organizationId: '00000000-0000-0000-0000-000000000000',
    };
  }

  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const appMeta = user.app_metadata ?? {};
  const userMeta = user.user_metadata ?? {};
  const rawRole = appMeta.role || userMeta.role;

  let resolvedRole = normalizeRole(rawRole);

  if (!resolvedRole) {
    // Attempt to read from organization_members server-side
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (member?.role) {
      resolvedRole = normalizeRole(member.role);
    }
  }

  if (!resolvedRole) {
    // Missing or invalid role: return null so fail-closed kicks in
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? 'unknown@example.com',
    name: userMeta.name ?? user.email?.split('@')[0] ?? 'Operator',
    role: resolvedRole,
    organizationId: appMeta.organization_id ?? '00000000-0000-0000-0000-000000000000',
  };
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(allowedRoles: CanonicalRole[]): Promise<
  | { authorized: true; session: UserSession }
  | { authorized: false; session: UserSession | null; reason: 'unauthenticated' | 'forbidden' }
> {
  const session = await getServerSession();
  if (!session) {
    return { authorized: false, session: null, reason: 'unauthenticated' };
  }

  if (!allowedRoles.includes(session.role)) {
    return { authorized: false, session, reason: 'forbidden' };
  }

  return { authorized: true, session };
}
