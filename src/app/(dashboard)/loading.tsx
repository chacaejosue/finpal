export default function DashboardLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-container rounded-md" />
          <div className="h-8 w-64 bg-surface-container-high rounded-xl" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-surface-container rounded-xl" />
          <div className="h-10 w-36 bg-primary/20 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-4 space-y-3">
            <div className="h-3 w-20 bg-surface-container rounded" />
            <div className="h-6 w-32 bg-surface-container-high rounded-lg" />
          </div>
        ))}
      </div>

      <div className="h-64 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60" />
    </div>
  );
}
