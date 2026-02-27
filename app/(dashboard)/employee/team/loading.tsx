import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72 mt-1" />
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Member filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
        ))}
      </div>

      {/* Team shift rows */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border p-4"
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
