import { authApi } from '@/features/auth/api/authApi';
import { authStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/ui/button';
import { CheckCircle2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TodoPage() {
  const navigate = useNavigate();

  async function logout() {
    authStore.getState().logout();
    await authApi.logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">로그인 성공!</h1>
        <p className="text-muted-foreground">대시보드 페이지가 곧 구현될 예정입니다.</p>
        <Button onClick={logout} variant="outline" className="mt-4">
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
