import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-44 mt-1" />
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        <div className="border-t border-border" />

        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}
