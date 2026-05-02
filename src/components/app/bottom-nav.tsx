"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type ServerAction = () => Promise<void>;

const primaryItems = [
  { href: "/tours", label: "Tours", icon: TourIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/venues", label: "Venues", icon: VenueIcon },
  { href: "/comedians", label: "Comedians", icon: ComedianIcon },
];

const moreItems = [
  { href: "/", label: "Dashboard", icon: DashboardIcon, exact: true },
  { href: "/reports", label: "Reports", icon: ActivityIcon, exact: false },
  { href: "/notifications", label: "Notifications", icon: BellIcon, exact: false },
  { href: "/activity", label: "Activity", icon: ActivityIcon, exact: false },
  { href: "/settings/team", label: "Team", icon: TeamIcon, exact: false },
  { href: "/help", label: "Help", icon: HelpIcon, exact: false },
];

function isActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav({
  signOutAction,
  displayName,
}: {
  signOutAction: ServerAction;
  displayName: string;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const prevPath = useRef(pathname);

  // Close drawer when route changes
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setMoreOpen(false);
    }
  }, [pathname]);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  const moreActive = moreItems.some((it) => isActive(pathname, it.href, it.exact));

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-200",
          moreOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        aria-hidden
        onClick={() => setMoreOpen(false)}
      />

      {/* More slide-up drawer */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 md:hidden bg-surface rounded-t-2xl border-t border-border shadow-2xl",
          "transition-transform duration-300 ease-out",
          moreOpen ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "var(--safe-area-bottom)" }}
        aria-hidden={!moreOpen}
      >
        <div className="flex justify-center pt-3 pb-1" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>

        <div className="px-4 pb-3">
          <p className="px-3 pt-2 pb-1 text-xs text-subtle truncate">
            {displayName}
          </p>

          <nav className="space-y-0.5">
            {moreItems.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-foreground hover:bg-muted active:bg-muted",
                  )}
                >
                  <span className={active ? "text-accent" : "text-subtle"}>
                    <Icon />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border mt-3 pt-2">
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted transition-colors text-left"
              >
                <SignOutIcon />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border bg-surface"
        style={{ paddingBottom: "var(--safe-area-bottom)" }}
        aria-label="Primary"
      >
        <div className="flex h-16">
          {primaryItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "tap-scale flex flex-1 flex-col items-center justify-center gap-1",
                  active ? "text-accent" : "text-subtle",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "tap-scale flex flex-1 flex-col items-center justify-center gap-1",
              moreOpen || moreActive ? "text-accent" : "text-subtle",
            )}
            aria-expanded={moreOpen}
            aria-label="More navigation"
          >
            <MoreIcon open={moreOpen} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function TourIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19L12 5L19 19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 3V5M16 3V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function VenueIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 21V10L12 4L21 10V21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V15H15V21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ComedianIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20C4 16.7 7.6 14.5 12 14.5C16.4 14.5 20 16.7 20 20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12H6L9 5L15 19L18 12H21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3 20C3 17 5.7 15 9 15C12.3 15 15 17 15 20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15 15.5C16.5 15 18.5 15.5 19.5 17"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.3 9.3C9.3 7.7 10.5 6.5 12 6.5C13.5 6.5 14.7 7.7 14.7 9.3C14.7 10.7 13.8 11.8 12.6 12.2C12.3 12.3 12 12.7 12 13.1V13.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="16 17 21 12 16 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoreIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("transition-transform duration-200", open && "rotate-90")}
    >
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
