import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Group cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
