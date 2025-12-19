import { cn } from '@/lib/utils';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dotClassName?: string;
}

export function LoadingDots({ size = 'sm', className, dotClassName }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className={cn('rounded-full bg-primary animate-bounce', sizeClasses[size], dotClassName)}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={cn('rounded-full bg-primary animate-bounce', sizeClasses[size], dotClassName)}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={cn('rounded-full bg-primary animate-bounce', sizeClasses[size], dotClassName)}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
