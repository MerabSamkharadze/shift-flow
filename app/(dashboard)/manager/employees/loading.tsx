import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/40 border-b border-border">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40 hidden sm:block" />
          <Skeleton className="h-3 w-24 hidden md:block" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-40 hidden sm:block" />
            <Skeleton className="h-5 w-16 rounded-full hidden md:block" />
            <Skeleton className="h-8 w-8 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
