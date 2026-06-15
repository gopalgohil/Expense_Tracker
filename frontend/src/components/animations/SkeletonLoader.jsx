/* Skeleton placeholders shown while API data loads */

export const SkeletonBlock = ({ className = '' }) => (
  <div className={`bg-ink-100 rounded-xl animate-pulse ${className}`} />
)

export const SummaryCardsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {[1, 2, 3, 4].map((n) => (
      <div key={n} className="card p-4 animate-pulse space-y-3">
        <div className="flex justify-between">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-8 w-8 rounded-xl" />
        </div>
        <SkeletonBlock className="h-7 w-24" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
    ))}
  </div>
)

export const StatsBarSkeleton = () => (
  <div className="card p-5 animate-pulse space-y-4">
    <div className="flex flex-wrap gap-6">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-8 w-24" />
        </div>
      ))}
    </div>
    <SkeletonBlock className="h-2.5 w-full rounded-full" />
  </div>
)

export const ChartSkeleton = ({ height = 200 }) => (
  <div className="card p-5 animate-pulse">
    <SkeletonBlock className="h-4 w-32 mb-4" />
    <SkeletonBlock className="w-full rounded-xl" style={{ height }} />
  </div>
)

export const ExpenseListSkeleton = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-4 flex-1 max-w-[180px]" />
          <SkeletonBlock className="h-5 w-16 ml-auto" />
        </div>
      </div>
    ))}
  </div>
)

export const BudgetSkeleton = () => (
  <div className="card p-5 animate-pulse space-y-4">
    <SkeletonBlock className="h-4 w-28" />
    {[1, 2].map((n) => (
      <div key={n} className="space-y-2">
        <div className="flex justify-between">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
        <SkeletonBlock className="h-2 w-full rounded-full" />
      </div>
    ))}
  </div>
)
