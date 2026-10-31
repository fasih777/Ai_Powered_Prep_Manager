export type CanonicalRole = 'operator' | 'reviewer' | 'manager';
export type RawRole = CanonicalRole | 'admin';

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
}

export function normalizeRole(role?: string | null): CanonicalRole | null {
  if (!role) return null;
  const lower = role.toLowerCase().trim();
  if (lower === 'admin' || lower === 'manager') return 'manager';
  if (lower === 'reviewer') return 'reviewer';
  if (lower === 'operator') return 'operator';
  return null;
}

export function getHomeRouteForRole(role: CanonicalRole): string {
  switch (role) {
    case 'operator':
      return '/review/new';
    case 'reviewer':
      return '/queue';
    case 'manager':
      return '/insights';
    default:
      return '/review/new';
  }
}

export function getNavItemsForRole(role: CanonicalRole, isLabEnabled: boolean = false): NavItem[] {
  switch (role) {
    case 'operator':
      return [
        { name: 'New review', href: '/review/new', iconName: 'PlusCircle' },
        { name: 'My reviews', href: '/reviews', iconName: 'ListChecks' },
        { name: 'Rules', href: '/rules', iconName: 'ShieldCheck' },
        { name: 'Settings', href: '/settings', iconName: 'Settings' },
      ];
    case 'reviewer':
      return [
        { name: 'Queue', href: '/queue', iconName: 'Inbox' },
        { name: 'All reviews', href: '/reviews', iconName: 'ListChecks' },
        { name: 'New review', href: '/review/new', iconName: 'PlusCircle' },
        { name: 'Rules', href: '/rules', iconName: 'ShieldCheck' },
        { name: 'Audit', href: '/audit', iconName: 'History' },
      ];
    case 'manager':
      const items: NavItem[] = [
        { name: 'Insights', href: '/insights', iconName: 'BarChart3' },
        { name: 'Queue', href: '/queue', iconName: 'Inbox' },
        { name: 'All reviews', href: '/reviews', iconName: 'ListChecks' },
        { name: 'New review', href: '/review/new', iconName: 'PlusCircle' },
        { name: 'Audit', href: '/audit', iconName: 'History' },
        { name: 'Rules', href: '/rules', iconName: 'ShieldCheck' },
        { name: 'Status', href: '/status', iconName: 'Activity' },
        { name: 'Settings', href: '/settings', iconName: 'Settings' },
      ];
      if (isLabEnabled) {
        items.push({ name: 'Developer lab', href: '/lab/scenarios', iconName: 'FlaskConical' });
      }
      return items;
  }
}
