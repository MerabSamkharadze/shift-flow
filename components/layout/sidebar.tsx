import { NavLinks } from "./nav-links";
import { LogoutButton } from "./logout-button";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Owner",
  manager: "Manager",
  employee: "Employee",
};

type Props = {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
};

function Avatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
      {initials}
    </div>
  );
}

export function Sidebar({ role, firstName, lastName, email }: Props) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-5">
        <span className="text-base font-bold tracking-tight">ShiftFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        <NavLinks role={role} />
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar firstName={firstName} lastName={lastName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {firstName} {lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {ROLE_LABEL[role]}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
