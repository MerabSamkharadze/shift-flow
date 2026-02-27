import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      {/* Swap cards */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
