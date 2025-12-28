import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import { getMenu } from './getMenu';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  const menu = getMenu(isMobile ? 'mobile' : 'desktop');

  return (
    <div className="min-h-screen bg-background">
      {/* ================= PC Layout ================= */}
      {!isMobile && (
        <div className="flex min-h-screen">
          <Sidebar menu={menu} />

          <div className="flex-1 flex flex-col">
            <Header />

            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      )}

      {/* ================= Mobile Layout ================= */}
      {isMobile && (
        <div className="flex flex-col min-h-screen">
          {/* 모바일에서는 Header만 사용 */}
          <Header />

          <main className="flex-1 p-4 pb-20">{children}</main>

          <BottomNav menu={menu} />
        </div>
      )}
    </div>
  );
}
