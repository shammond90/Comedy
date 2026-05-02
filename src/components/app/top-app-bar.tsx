"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/app/notification-bell";
import { cn } from "@/lib/utils";

const ROOT_PATHS = new Set([
  "/",
  "/tours",
  "/calendar",
  "/venues",
  "/comedians",
  "/activity",
  "/notifications",
  "/settings",
  "/settings/team",
  "/settings/calendars",
  "/help",
]);

export function TopAppBar({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevPath = useRef(pathname);

  const showBack = !ROOT_PATHS.has(pathname);

  // Close search on route change
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setSearchOpen(false);
    }
  }, [pathname]);

  // Focus + lock scroll while search open
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [searchOpen]);

  // Close on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-40 md:hidden border-b border-border bg-surface"
        style={{ paddingTop: "var(--safe-area-top)" }}
      >
        <div className="flex h-12 items-center justify-between px-2">
          <div className="flex w-12 items-center justify-start">
            {showBack ? (
              <button
                type="button"
                onClick={() => router.back()}
                className="tap-scale flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted active:bg-muted"
                aria-label="Go back"
              >
                <ChevronLeftIcon />
              </button>
            ) : (
              <span
                className="font-display text-base text-foreground pl-2"
                aria-hidden
              >
                GigBook
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="tap-scale flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted active:bg-muted"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
            <NotificationBell userId={userId} />
          </div>
        </div>
      </header>

      {/* Full-screen search overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden bg-background transition-opacity duration-150",
          searchOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!searchOpen}
      >
        <div
          className="border-b border-border bg-surface"
          style={{ paddingTop: "var(--safe-area-top)" }}
        >
          <form
            action="/search"
            method="get"
            className="flex h-12 items-center gap-2 px-2"
            onSubmit={() => setSearchOpen(false)}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="tap-scale flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
              aria-label="Close search"
            >
              <ChevronLeftIcon />
            </button>
            <input
              ref={inputRef}
              type="search"
              name="q"
              placeholder="Search tours, shows, venues…"
              aria-label="Search"
              autoComplete="off"
              className="flex-1 bg-transparent border-0 outline-none text-base placeholder:text-subtle"
            />
          </form>
        </div>
        <div className="px-4 py-6 text-sm text-muted-foreground">
          <p>Search across tours, shows, venues and comedians.</p>
          <p className="mt-2 text-xs text-subtle">Press enter to search.</p>
        </div>
      </div>
    </>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M20 20L16.5 16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
