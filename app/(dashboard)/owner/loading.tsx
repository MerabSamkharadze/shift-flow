import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Managers + Swaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-4 px-3 py-2 bg-muted/40 border-b border-border">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24 hidden sm:block" />
                <Skeleton className="h-3 w-16" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 hidden sm:block" />
                  <Skeleton className="h-5 w-16 rounded-full ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity + Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-border px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
