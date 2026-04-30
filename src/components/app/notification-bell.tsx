"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchNotificationsAction,
  markAllReadAction,
  markReadAction,
} from "@/lib/notification-actions";

type Row = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

function relTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [unread, setUnread] = useState(0);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const data = await fetchNotificationsAction();
    setRows(
      data.rows.map((r) => ({
        ...r,
        readAt: r.readAt ? new Date(r.readAt) : null,
        createdAt: new Date(r.createdAt),
      })),
    );
    setUnread(data.unread);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Realtime: bump on any insert for this user.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-notif-popover]")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [open]);

  const handleClick = (r: Row) => {
    if (!r.readAt) {
      startTransition(async () => {
        await markReadAction([r.id]);
        await refresh();
      });
    }
    setOpen(false);
  };

  const onMarkAll = () => {
    startTransition(async () => {
      await markAllReadAction();
      await refresh();
    });
  };

  return (
    <div className="relative" data-notif-popover>
      <button
        type="button"
        aria-label="Notifications"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative rounded-md p-1.5 text-foreground hover:bg-accent"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={onMarkAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
          </div>
          <ul className="max-h-96 divide-y divide-border overflow-auto">
            {rows.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </li>
            ) : (
              rows.map((r) => {
                const inner = (
                  <div
                    className={`flex items-start gap-2 px-3 py-2.5 text-sm ${
                      !r.readAt ? "bg-accent/40" : ""
                    }`}
                  >
                    {!r.readAt && (
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{r.title}</div>
                      {r.body && (
                        <div className="truncate text-xs text-muted-foreground">
                          {r.body}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {relTime(r.createdAt)}
                    </span>
                  </div>
                );
                return (
                  <li key={r.id}>
                    {r.link ? (
                      <Link
                        href={r.link}
                        onClick={() => handleClick(r)}
                        className="block hover:bg-accent"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClick(r)}
                        className="block w-full text-left hover:bg-accent"
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 6.5C4 4.3 5.8 2.5 8 2.5C10.2 2.5 12 4.3 12 6.5V9L13 11H3L4 9V6.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6.5 12.5C6.5 13.3 7.2 14 8 14C8.8 14 9.5 13.3 9.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
