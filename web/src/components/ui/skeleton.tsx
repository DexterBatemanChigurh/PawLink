interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  )
}

export function PostSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Skeleton className="h-32 w-full rounded-none" />
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <Skeleton className="w-20 h-20 rounded-xl border-2 border-white" />
            <div className="ml-4 space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PetCardSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Skeleton className="w-full h-48 rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  )
}
