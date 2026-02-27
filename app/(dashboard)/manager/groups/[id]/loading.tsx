import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Back link */}
      <Skeleton className="h-4 w-16 mb-6" />

      {/* Group title */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border p-4"
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
