import { cn } from '@/lib/utils';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dotClassName?: string;
  fullscreen?: boolean;
  label?: string;
}

export function LoadingDots({
  className,
  dotClassName,
  fullscreen = false,
  label,
}: LoadingDotsProps) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
        <div className={cn('flex items-center gap-6', className)}>
          <div
            className={cn('h-5 w-5 rounded-full bg-primary animate-bounce', dotClassName)}
            style={{ animationDelay: '0ms' }}
          />
          <div
            className={cn('h-5 w-5 rounded-full bg-primary animate-bounce', dotClassName)}
            style={{ animationDelay: '150ms' }}
          />
          <div
            className={cn('h-5 w-5 rounded-full bg-primary animate-bounce', dotClassName)}
            style={{ animationDelay: '300ms' }}
          />
        </div>
        {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className={cn('h-2 w-2 rounded-full bg-primary animate-bounce', dotClassName)}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={cn('h-2 w-2 rounded-full bg-primary animate-bounce', dotClassName)}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={cn('h-2 w-2 rounded-full bg-primary animate-bounce', dotClassName)}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
