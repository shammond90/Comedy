"use client";

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
  { href: "/settings/team", label: "Team", icon: <TeamIcon /> },
];

export function Sidebar({
  userEmail,
  signOutAction,
}: {
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface-2/30 px-3 py-6">
      <Link
        href="/"
        className="px-3 pb-6 flex items-center gap-2 text-foreground"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground font-display text-lg">
          C
        </span>
        <span className="font-display text-lg leading-none">Comedy</span>
      </Link>

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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
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
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-border pt-4 px-3">
        <p className="truncate text-xs text-subtle mb-2">{userEmail}</p>
        <div className="space-y-1 mb-3">
          <Link
            href="/help"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpIcon />
            User guide
          </Link>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

/* ---------------- icons (16x16, stroke 1.5) ---------------- */

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function TourIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 13L8 3L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="9" r="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6H14" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 2V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 2V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function VenueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 14V7L8 3L14 7V14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 14V10H10V14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function ComedianIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 14C3 11.5 5.2 10 8 10C10.8 10 13 11.5 13 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.5" cy="6.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 13.5C2 11.6 3.8 10.3 6 10.3C8.2 10.3 10 11.6 10 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10.5 13.5C10.5 12.1 12 11 13.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.2 6.2C6.2 5.1 7 4.4 8 4.4C9 4.4 9.8 5.1 9.8 6.2C9.8 7.1 9.2 7.7 8.5 8.1C8.2 8.3 8 8.6 8 9V9.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
    </svg>
  );
}
