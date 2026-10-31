import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../supabase/server';
import { CanonicalRole, normalizeRole } from './roles';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: CanonicalRole;
  organizationId: string;
  organizationName?: string;
  accessToken: string; // Exposed to server-side code only (BFF/actions); never to client components
}

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'forbidden';

export interface AuthContext {
  status: AuthStatus;
  session: UserSession | null;
  reason?: string;
}

/**
 * Checks for a local development fake role.
 * Strictly gated: NEXT_PUBLIC_APP_ENV === 'local' AND NODE_ENV !== 'production'.
 * Impossible to activate in staging or production.
 */
function getDevFakeRole(): CanonicalRole | null {
  const isLocalEnv = process.env.NEXT_PUBLIC_APP_ENV === 'local';
  const isNotProduction = process.env.NODE_ENV !== 'production';

  if (isLocalEnv && isNotProduction && process.env.DEV_FAKE_ROLE) {
    return normalizeRole(process.env.DEV_FAKE_ROLE);
  }
  return null;
}

/**
 * Helper to extract current URL/pathname from middleware request headers
 * for the ?next= parameter.
 */
export function getNextPath(): string {
  try {
    const headerList = headers();
    const pathname = headerList.get('x-pathname') || '';
    if (pathname && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/auth')) {
      return `?next=${encodeURIComponent(pathname)}`;
    }
  } catch {
    // In case headers() is invoked in environments without request headers
  }
  return '';
}

/**
 * Evaluates the authentication context for the current request.
 * - Authenticated with valid role -> { status: 'authenticated', session }
 * - No session -> { status: 'unauthenticated', session: null }
 * - Authenticated in Supabase but no membership or unknown role -> { status: 'forbidden', session: null }
 */
export async function getAuthContext(): Promise<AuthContext> {
  const devRole = getDevFakeRole();
  if (devRole) {
    return {
      status: 'authenticated',
      session: {
        userId: '00000000-0000-0000-0000-000000000001',
        email: `dev-${devRole}@facility.local`,
        name: `Dev ${devRole.charAt(0).toUpperCase() + devRole.slice(1)}`,
        role: devRole,
        organizationId: '00000000-0000-0000-0000-000000000000',
        organizationName: 'Primary Inspection Facility',
        accessToken: 'dev-fake-token-local-only',
      },
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: 'unauthenticated', session: null };
  }

  // Obtain verified access token for server-side BFF proxying
  const {
    data: { session: rawSession },
  } = await supabase.auth.getSession();
  const accessToken = rawSession?.access_token || '';

  // Query organization_members for role and organization
  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select('role, organization_id, organizations(id, name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memberError || !member || !member.role) {
    return {
      status: 'forbidden',
      session: null,
      reason: 'Your account is authenticated, but is not assigned to any active organization.',
    };
  }

  const canonicalRole = normalizeRole(member.role);
  if (!canonicalRole) {
    return {
      status: 'forbidden',
      session: null,
      reason: `Your account role (${member.role}) is unrecognized or has invalid permissions.`,
    };
  }

  const orgRecord = (member as { organizations?: { id?: string; name?: string } | null }).organizations;
  const orgName = orgRecord?.name || 'Inspection Facility';

  return {
    status: 'authenticated',
    session: {
      userId: user.id,
      email: user.email ?? 'unknown@example.com',
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Operator',
      role: canonicalRole,
      organizationId: member.organization_id,
      organizationName: orgName,
      accessToken,
    },
  };
}

/**
 * Returns the current authenticated UserSession or null if unauthenticated or forbidden.
 */
export async function getServerSession(): Promise<UserSession | null> {
  const ctx = await getAuthContext();
  return ctx.session;
}

/**
 * Requires a valid authenticated session.
 * - No session -> redirect('/login?next=...')
 * - Authenticated but no membership/unknown role -> redirects to login with reason
 */
export async function requireAuth(nextUrl?: string): Promise<UserSession> {
  const ctx = await getAuthContext();

  if (ctx.status === 'unauthenticated') {
    const nextParam = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : getNextPath();
    redirect(`/login${nextParam}`);
  }

  if (ctx.status === 'forbidden' || !ctx.session) {
    redirect(`/login?error=${encodeURIComponent(ctx.reason || 'Account not authorized.')}`);
  }

  return ctx.session;
}

/**
 * Requires the user to have one of the allowed roles.
 * - No session -> redirect('/login?next=...')
 * - Missing role or invalid role -> returns { authorized: false, reason: 'forbidden' }
 * - Authorized -> returns { authorized: true, session }
 */
export async function requireRole(allowedRoles: CanonicalRole[]): Promise<
  | { authorized: true; session: UserSession }
  | { authorized: false; session: UserSession | null; reason: 'unauthenticated' | 'forbidden' }
> {
  const ctx = await getAuthContext();

  if (ctx.status === 'unauthenticated') {
    redirect(`/login${getNextPath()}`);
  }

  if (ctx.status === 'forbidden' || !ctx.session) {
    return { authorized: false, session: null, reason: 'forbidden' };
  }

  if (!allowedRoles.includes(ctx.session.role)) {
    return { authorized: false, session: ctx.session, reason: 'forbidden' };
  }

  return { authorized: true, session: ctx.session };
}
