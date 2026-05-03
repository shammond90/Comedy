"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: React.ReactNode };

const items: Item[] = [
  { href: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/tours", label: "Tours", icon: <TourIcon /> },
  { href: "/calendar", label: "Calendar", icon: <CalendarIcon /> },
  { href: "/venues", label: "Venues", icon: <VenueIcon /> },
  { href: "/comedians", label: "Comedians", icon: <ComedianIcon /> },
  { href: "/reports", label: "Reports", icon: <ReportsIcon /> },
  { href: "/activity", label: "Activity", icon: <ActivityIcon /> },
  { href: "/settings/team", label: "Team", icon: <TeamIcon /> },
];

/* ---------- Tooltip pill (shown on hover when collapsed) ---------- */

function NavTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 z-50">
      {label}
    </span>
  );
}

export function Sidebar({
  displayName,
  signOutAction,
}: {
  displayName: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // Delay enabling transition until after first mount to avoid initial flash
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    } catch {
      // localStorage unavailable
    }
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "group/sidebar hidden md:flex flex-col border-r border-border bg-surface-2/30",
        "sticky top-0 self-start h-screen relative",
        ready && "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-60",
      )}
    >
      {/* Edge toggle handle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50",
          "flex h-5 w-5 items-center justify-center",
          "rounded-full border border-border bg-surface shadow-sm",
          "text-muted-foreground hover:text-foreground",
          "opacity-0 group-hover/sidebar:opacity-100 focus-visible:opacity-100",
          "transition-opacity duration-150",
        )}
      >
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>

      {/* Inner content — no overflow set so tooltips escape */}
      <div className="flex flex-col h-full px-3 py-6">
        {/* Logo */}
        <Link
          href="/"
          className={cn(
            "pb-6 flex items-center text-foreground shrink-0",
            collapsed ? "justify-center" : "gap-2 px-3",
          )}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-display text-lg">
            C
          </span>
          {!collapsed && (
            <span className="font-display text-lg leading-none">Comedy</span>
          )}
        </Link>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5">
          {items.map((it) => {
            const active =
              it.href === "/"
                ? pathname === "/"
                : pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "group/nav relative flex items-center rounded-lg py-2 text-sm transition-colors",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  active
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-surface/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "shrink-0",
                    active ? "text-accent" : "text-subtle",
                  )}
                >
                  {it.icon}
                </span>
                {!collapsed && it.label}
                {collapsed && <NavTooltip label={it.label} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: username, help, sign out */}
        <div
          className={cn(
            "mt-6 border-t border-border pt-4 shrink-0",
            collapsed ? "" : "px-3",
          )}
        >
          {!collapsed && (
            <p className="truncate text-sm font-medium text-foreground mb-2">
              {displayName}
            </p>
          )}

          {/* Help */}
          <div className={collapsed ? "mb-1 flex justify-center" : "space-y-1 mb-3"}>
            {collapsed ? (
              <div className="group/nav relative">
                <Link
                  href="/help"
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-surface/60 hover:text-foreground transition-colors"
                >
                  <HelpIcon />
                </Link>
                <NavTooltip label="User guide" />
              </div>
            ) : (
              <Link
                href="/help"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpIcon />
                User guide
              </Link>
            )}
          </div>

          {/* Sign out */}
          {collapsed ? (
            <div className="group/nav relative flex justify-center">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-surface/60 hover:text-foreground transition-colors"
                >
                  <SignOutIcon />
                </button>
              </form>
              <NavTooltip label="Sign out" />
            </div>
          ) : (
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons (16×16, stroke 1.4)                                                  */
/* -------------------------------------------------------------------------- */

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function TourIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 13L8 3L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="9" r="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6H14" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 2V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 2V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function VenueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 14V7L8 3L14 7V14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 14V10H10V14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function ComedianIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 14C3 11.5 5.2 10 8 10C10.8 10 13 11.5 13 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 12V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.5 12V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 12V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12.5 12V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M1 13.5H15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 8H4.5L6 4L10 12L11.5 8H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.5" cy="6.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 13.5C2 11.6 3.8 10.3 6 10.3C8.2 10.3 10 11.6 10 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10.5 13.5C10.5 12.1 12 11 13.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.2 6.2C6.2 5.1 7 4.4 8 4.4C9 4.4 9.8 5.1 9.8 6.2C9.8 7.1 9.2 7.7 8.5 8.1C8.2 8.3 8 8.6 8 9V9.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
