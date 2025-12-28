import { routeMeta } from '@/app/routes.meta';
import type { MenuPlatform } from './menu.config';
import { MENU_RULES } from './menu.config';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { LucideProps } from 'lucide-react';

export interface MenuItem {
  path: string;
  label: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
}

export function getMenu(platform: MenuPlatform): MenuItem[] {
  const rules = MENU_RULES[platform];

  return routeMeta
    .filter((route) => {
      if (!route.showInMenu || !route.label) return false;

      const rule = rules[route.path];
      return rule?.visible === true;
    })
    .map((route) => ({
      path: route.path,
      label: route.label!,
      icon: route.icon,
      order: rules[route.path].order,
    }))
    .sort((a, b) => a.order - b.order);
}
