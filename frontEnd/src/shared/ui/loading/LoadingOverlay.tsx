import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  message?: string;
  fullscreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  message = '로딩 중...',
  fullscreen = false,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullscreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
        !fullscreen && 'w-full h-full',
        className,
      )}
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      {message && <p className="text-sm font-medium text-muted-foreground">{message}</p>}
    </div>
  );
}
