import { requireAuth } from '@/lib/auth/session';
import { Chip } from '@/components/ui/Chip';
import { ThemeToggle } from '@/components/shell/ThemeToggle';

export default async function SettingsPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">
          User profile and application appearance preferences.
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-[8px] border border-line bg-surface p-6 space-y-4">
        <h2 className="text-base font-semibold text-ink">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-ink-muted block">Name</span>
            <span className="font-medium text-ink">{session.name}</span>
          </div>
          <div>
            <span className="text-xs text-ink-muted block">Email</span>
            <span className="font-medium text-ink">{session.email}</span>
          </div>
          <div>
            <span className="text-xs text-ink-muted block">Role</span>
            <Chip variant={session.role === 'manager' ? 'brand' : 'neutral'} className="mt-1 capitalize">
              {session.role}
            </Chip>
          </div>
          <div>
            <span className="text-xs text-ink-muted block">Organization ID</span>
            <span className="font-mono text-xs text-ink-muted truncate block">{session.organizationId}</span>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="rounded-[8px] border border-line bg-surface p-6 space-y-4">
        <h2 className="text-base font-semibold text-ink">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Theme</p>
            <p className="text-xs text-ink-muted">Toggle between Light, Dark, or System mode.</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
