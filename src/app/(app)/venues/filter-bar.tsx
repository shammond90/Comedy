"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const VENUE_TYPES = [
  "comedy_club",
  "theatre",
  "arena",
  "arts_centre",
  "pub",
  "other",
] as const;

interface Props {
  q: string;
  type: string;
  capOp: string;
  capMin: string;
  capMax: string;
  hasFilters: boolean;
}

export function VenueFilterBar({
  q,
  type,
  capOp: initialCapOp,
  capMin,
  capMax,
  hasFilters,
}: Props) {
  const [capOp, setCapOp] = useState(initialCapOp);

  const showMin = capOp === "gt" || capOp === "between";
  const showMax = capOp === "lt" || capOp === "between";

  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3"
    >
      <div className="flex-1 min-w-[12rem]">
        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Search
        </label>
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Name, city, contact…"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Type
        </label>
        <Select name="type" defaultValue={type}>
          <option value="">All</option>
          {VENUE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Capacity
        </label>
        <Select
          name="capOp"
          value={capOp}
          onChange={(e) => setCapOp(e.target.value)}
        >
          <option value="">Any</option>
          <option value="lt">Less than</option>
          <option value="gt">More than</option>
          <option value="between">Between</option>
        </Select>
      </div>

      {showMin && (
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Min
          </label>
          <Input
            type="number"
            name="capMin"
            defaultValue={capMin}
            min={0}
            className="w-24"
            autoFocus
          />
        </div>
      )}

      {showMax && (
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Max
          </label>
          <Input
            type="number"
            name="capMax"
            defaultValue={capMax}
            min={0}
            className="w-24"
            autoFocus={capOp === "lt"}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" variant="accent">
          Filter
        </Button>
        {hasFilters && (
          <Link href="/venues">
            <Button type="button" variant="ghost">
              Clear
            </Button>
          </Link>
        )}
      </div>
    </form>
  );
}
