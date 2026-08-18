import type { LucideIcon } from 'lucide-react';
import { Home, Layers, GitBranch, Key, Settings } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/projects', label: 'Projects', icon: Layers },
  { href: '/versions', label: 'Versions', icon: GitBranch },
  { href: '/keys', label: 'API Keys', icon: Key },
  { href: '/settings', label: 'Settings', icon: Settings },
];
