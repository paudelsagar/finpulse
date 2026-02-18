
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search & Filter Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="h-10 w-48 bg-muted rounded-lg shimmer" />
        <div className="flex gap-2">
            <div className="h-10 w-64 bg-muted rounded-lg shimmer" />
        </div>
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl border border-border/50 shimmer" />
        ))}
      </div>

      {/* Main Charts Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-4 h-[400px] bg-muted/50 rounded-xl border border-border/50 shimmer" />
        <div className="lg:col-span-2 h-[400px] bg-muted/50 rounded-xl border border-border/50 shimmer" />
      </div>

      {/* Secondary Charts Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="lg:col-span-2 h-[300px] bg-muted/50 rounded-xl border border-border/50 shimmer" />
        ))}
      </div>
    </div>
  )
}
