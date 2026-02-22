"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Database } from "@/lib/types/database.types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });
  }, [userId, supabase]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            [payload.new as Notification, ...prev].slice(0, 10),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // ── Actions ────────────────────────────────────────────────────────────────
  function handleClick(n: Notification) {
    // 1. Optimistic UI update — happens instantly, no waiting
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );

      // 2. Persist to DB in the background — errors are logged but don't
      //    block navigation or revert the optimistic update.
      supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", n.id)
        .then(({ error }) => {
          if (error) console.error("Failed to mark notification as read:", error);
        });
    }

    // 3. Close the Sheet
    setOpen(false);

    // 4. Navigate — deferred by one tick so Radix can release its
    //    scroll-lock / focus-trap before Next.js starts the transition.
    if (n.action_url) {
      setTimeout(() => router.push(n.action_url!), 0);
    }
  }

  async function markAllRead() {
    if (!notifications.some((n) => !n.read)) return;

    // Optimistic update first so the UI responds immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) console.error("Failed to mark all notifications as read:", error);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-sm p-0 flex flex-col"
      >
        {/* Header — pr-10 keeps content clear of the Sheet's absolute X button */}
        <SheetHeader className="flex-row items-center gap-3 px-5 py-4 pr-10 border-b border-border space-y-0 shrink-0">
          <SheetTitle className="text-base flex-1">Notifications</SheetTitle>
          {unreadCount > 0 && (
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {unreadCount} unread
            </span>
          )}
        </SheetHeader>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <BellOff size={32} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left px-5 py-4 transition-colors hover:bg-muted/50 active:bg-muted",
                  !n.read && "bg-primary/[0.04]",
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Unread dot — mt-1 vertically centres it with the title's cap-height */}
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full transition-colors",
                      n.read ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        n.read
                          ? "font-normal text-foreground/80"
                          : "font-semibold text-foreground",
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer — mark all as read */}
        {notifications.some((n) => !n.read) && (
          <div className="border-t border-border px-5 py-3 shrink-0">
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck size={13} />
              Mark all as read
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
