import { CheckCircle2 } from 'lucide-react';

export default function TodoPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">로그인 성공!</h1>
        <p className="text-muted-foreground">대시보드 페이지가 곧 구현될 예정입니다.</p>
      </div>
    </div>
  );
}
