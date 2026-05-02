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
        "-mx-4 px-4 md:-mx-8 md:px-8 mb-6 md:mb-8 border-b border-border",
        sticky &&
          "md:sticky md:top-0 md:z-30 md:bg-background/75 md:backdrop-blur-md md:supports-[backdrop-filter]:bg-background/65",
        "py-4 md:py-5 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-4",
        className,
      )}
    >
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <div className="text-xs uppercase tracking-wider text-subtle font-medium">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl md:text-3xl text-foreground leading-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 w-full md:w-auto md:shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </header>
  );
}

