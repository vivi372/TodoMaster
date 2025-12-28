import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { MenuItem } from './getMenu';

export function BottomNav({ menu }: { menu: MenuItem[] }) {
  const location = useLocation();

  // location 객체에서 pathname 속성 추출
  const pathname = location.pathname;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {menu.map((item, index) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <>
              {index === 2 && (
                <Link key="/create" to="/create">
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-br from-primary to-amber-400 hover:shadow-xl transition-all"
                  >
                    <Plus className="h-6 w-6 text-white" />
                  </Button>
                </Link>
              )}
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
              >
                <div
                  className={cn(
                    'relative flex flex-col items-center gap-1',
                    isActive && 'text-primary',
                    !isActive && 'text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </div>
              </Link>
            </>
          );
        })}
      </div>
    </nav>
  );
}
