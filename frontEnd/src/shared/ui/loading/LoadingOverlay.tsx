import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message = '로딩 중...', className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center gap-4',
        'bg-background/80 backdrop-blur-sm',
        className,
      )}
    >
      <Loader2 className="h-14 w-14 animate-spin text-primary" />
      {message && <p className="text-sm font-medium text-muted-foreground">{message}</p>}
    </div>
  );
}
