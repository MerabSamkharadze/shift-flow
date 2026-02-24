"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deactivateManager } from "@/app/actions/owner";
import { cn } from "@/lib/utils";

type Manager = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
};

type Status = "active" | "pending" | "inactive";

function getStatus(m: Manager): Status {
  if (!m.is_active) return "inactive";
  if (m.must_change_password) return "pending";
  return "active";
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
        status === "pending" &&
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
        status === "inactive" && "text-muted-foreground",
      )}
    >
      {status === "active" && "Active"}
      {status === "pending" && "Invite pending"}
      {status === "inactive" && "Inactive"}
    </Badge>
  );
}

function DeactivateButton({ managerId }: { managerId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deactivateManager(managerId);
          router.refresh();
        })
      }
      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Deactivate"}
    </button>
  );
}

export function ManagersTable({ managers }: { managers: Manager[] }) {
  if (managers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No managers yet. Use &ldquo;Add Manager&rdquo; to send an invite.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
              Name
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
              Email
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
              Status
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
              Added
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {managers.map((m, i) => {
            const status = getStatus(m);
            return (
              <tr
                key={m.id}
                className={
                  i !== managers.length - 1 ? "border-b border-border" : ""
                }
              >
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  {m.first_name} {m.last_name}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(m.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.is_active && <DeactivateButton managerId={m.id} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
