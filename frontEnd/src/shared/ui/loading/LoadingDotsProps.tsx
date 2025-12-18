import { cn } from '@/lib/utils';

interface LoadingDotsProps {
  className?: string;
  dotClassName?: string;
}

export function LoadingDots({ className, dotClassName }: LoadingDotsProps) {
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
