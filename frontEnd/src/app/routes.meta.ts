import {
  Bell,
  Calendar,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  Settings,
  User,
  type LucideProps,
} from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface RouteMeta {
  path: string;
  label?: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
  showInMenu?: boolean;
}

export const routeMeta: RouteMeta[] = [
  {
    path: '/dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    showInMenu: true,
  },
  {
    path: '/todos',
    label: '할 일',
    icon: CheckSquare,
    showInMenu: true,
  },
  {
    path: '/profile',
    label: '프로필',
    icon: User,
    showInMenu: true,
  },
  {
    path: '/calendar',
    label: '캘린더',
    icon: Calendar,
    showInMenu: true,
  },
  {
    path: '/alerts',
    label: '알림',
    icon: Bell,
    showInMenu: true,
  },
  {
    path: '/settings',
    label: '설정',
    icon: Settings,
    showInMenu: true,
  },
];
