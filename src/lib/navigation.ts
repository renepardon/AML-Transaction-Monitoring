import {
  Bell,
  Briefcase,
  Database,
  FileText,
  LayoutGrid,
  ScrollText,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { View } from '@/stores/useUiStore';

export interface NavItem {
  view: View;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { view: 'overview', label: 'Overview', icon: LayoutGrid },
  { view: 'cases', label: 'Cases', icon: Briefcase },
  { view: 'alerts', label: 'Alert queue', icon: Bell },
  { view: 'clients', label: 'Clients', icon: Users },
  { view: 'reports', label: 'Reports', icon: FileText },
  { view: 'audit', label: 'Audit log', icon: ScrollText },
  { view: 'data', label: 'Data', icon: Database },
  { view: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

export function viewLabel(view: View): string {
  return NAV_ITEMS.find((n) => n.view === view)?.label ?? view;
}
