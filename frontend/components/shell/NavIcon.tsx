import React from 'react';
import {
  PlusCircle,
  ListChecks,
  ShieldCheck,
  Settings,
  Inbox,
  History,
  BarChart3,
  Activity,
  FlaskConical,
  HelpCircle,
} from 'lucide-react';

interface NavIconProps {
  name: string;
  className?: string;
}

export function NavIcon({ name, className = 'h-5 w-5' }: NavIconProps) {
  switch (name) {
    case 'PlusCircle':
      return <PlusCircle className={className} aria-hidden="true" />;
    case 'ListChecks':
      return <ListChecks className={className} aria-hidden="true" />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} aria-hidden="true" />;
    case 'Settings':
      return <Settings className={className} aria-hidden="true" />;
    case 'Inbox':
      return <Inbox className={className} aria-hidden="true" />;
    case 'History':
      return <History className={className} aria-hidden="true" />;
    case 'BarChart3':
      return <BarChart3 className={className} aria-hidden="true" />;
    case 'Activity':
      return <Activity className={className} aria-hidden="true" />;
    case 'FlaskConical':
      return <FlaskConical className={className} aria-hidden="true" />;
    default:
      return <HelpCircle className={className} aria-hidden="true" />;
  }
}
