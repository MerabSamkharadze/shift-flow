import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/40 border-b border-border">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
