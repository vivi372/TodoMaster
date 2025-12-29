export type MenuPlatform = 'desktop' | 'mobile';

interface MenuRule {
  order: number;
  visible: boolean;
}

export const MENU_RULES: Record<MenuPlatform, Record<string, MenuRule>> = {
  desktop: {
    '/dashboard': { order: 1, visible: true },
    '/todos': { order: 2, visible: true },
    '/calendar': { order: 3, visible: true },
    '/alerts': { order: 4, visible: true },
    '/settings': { order: 5, visible: true },
  },

  mobile: {
    '/todos': { order: 1, visible: true },
    '/calendar': { order: 2, visible: true },
    '/alerts': { order: 3, visible: true },
    '/profile': { order: 4, visible: true },
  },
};
