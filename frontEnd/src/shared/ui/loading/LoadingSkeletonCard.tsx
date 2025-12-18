import { Card, CardContent, CardHeader } from '../card';
import { Skeleton } from '../skeleton';

interface LoadingSkeletonCardProps {
  count?: number;
}

export function LoadingSkeletonCard({ count = 3 }: LoadingSkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}
