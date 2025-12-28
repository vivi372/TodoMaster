import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, ChevronLeft, Sparkles } from 'lucide-react';

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import type { MenuItem } from './getMenu';

export function Sidebar({ menu }: { menu: MenuItem[] }) {
  const location = useLocation();

  // location 객체에서 pathname 속성 추출
  const pathname = location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ width: collapsed ? 80 : 240 }}
      animate={{ width: collapsed ? 80 : 240 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:flex flex-col h-screen bg-white border-r border-border sticky top-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-amber-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">Todori</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menu.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link to={item.path}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative',
                      'hover:bg-accent/50',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('h-5 w-5 flex-shrink-0')} />
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                    {isActive && !collapsed && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary rounded-lg -z-10"
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10',
            collapsed && 'justify-center',
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">로그아웃</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
