"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { deactivateEmployee } from "@/app/actions/manager";
import { cn } from "@/lib/utils";

type Group = { id: string; name: string; color: string };
type Status = "active" | "pending" | "inactive";

export type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  groups: Group[];
};

function getStatus(e: EmployeeRow): Status {
  if (!e.isActive) return "inactive";
  if (e.mustChangePassword) return "pending";
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

function DeactivateButton({ employeeId }: { employeeId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deactivateEmployee(employeeId);
          router.refresh();
        })
      }
      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Deactivate"}
    </button>
  );
}

export function EmployeesTable({ employees }: { employees: EmployeeRow[] }) {
  if (employees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No employees yet. Use &ldquo;Add Employee&rdquo; to send an invite.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Name
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Email
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Status
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Groups
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3">
              Added
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {employees.map((e, i) => {
            const status = getStatus(e);
            return (
              <tr
                key={e.id}
                className={
                  i !== employees.length - 1 ? "border-b border-border" : ""
                }
              >
                <td className="px-4 py-3 font-medium">
                  {e.firstName} {e.lastName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3">
                  {e.groups.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {e.groups.map((g) => (
                        <span
                          key={g.id}
                          className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${g.color}22`,
                            color: g.color,
                          }}
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  {e.isActive && <DeactivateButton employeeId={e.id} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
