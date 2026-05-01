"use client";

import { Input } from "@/components/ui/input";

export function GlobalSearchInput() {
  return (
    <form action="/search" method="get" className="hidden md:block">
      <Input
        type="search"
        name="q"
        placeholder="Search…"
        aria-label="Global search"
        className="h-9 w-56 rounded-full border-border-strong/60 bg-surface px-4 text-sm"
      />
    </form>
  );
}
