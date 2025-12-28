import { Bell, Search, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useUser } from '@/features/user/hooks/useUser';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  // useUser을 통해서 유저 프로필 가져오기
  const { headerProfile, isLoading } = useUser();
  // useAuth에서 로그아웃 함수 가져오기
  const { logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-border sticky top-0 z-40">
      {isLoading ? (
        <div className="m-3">
          <Skeleton className="h-5 w-3/4 mt-1" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </div>
      ) : (
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu + Search */}
          <div className="flex items-center gap-3 flex-1">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="할 일 검색..."
                className="pl-10 bg-accent/30 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>알림</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-4 text-sm text-muted-foreground text-center">
                  새로운 알림이 없습니다
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={headerProfile?.profileImg ?? '/images/default-profile.png'} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      사용자
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {headerProfile?.nickname ?? '홍길동'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>프로필</DropdownMenuItem>
                <DropdownMenuItem>설정</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => logout()}>
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </header>
  );
}
