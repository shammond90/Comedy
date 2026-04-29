import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className,
  sticky = true,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <header
      className={cn(
        // Bleed beyond the page padding so the blur backdrop reaches the edges of the content column.
        "-mx-8 px-8 mb-8 border-b border-border",
        sticky &&
          "sticky top-0 z-30 bg-background/75 backdrop-blur-md supports-[backdrop-filter]:bg-background/65",
        "py-5 flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <div className="text-xs uppercase tracking-wider text-subtle font-medium">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl text-foreground leading-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}

