import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Schedule grid */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-border bg-muted/40">
          <div className="p-3">
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 border-l border-border">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-8 mt-1" />
            </div>
          ))}
        </div>
        {/* Member rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-8 border-b border-border last:border-0"
          >
            <div className="p-3 flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
            </div>
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="p-2 border-l border-border">
                <Skeleton className="h-8 w-full rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
