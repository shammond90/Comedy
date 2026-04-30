"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CalendarUrlField({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/calendars/${token}`
      : `/api/calendars/${token}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code className="truncate rounded bg-muted px-1.5 py-0.5 text-xs">
        …/api/calendars/{token.slice(0, 8)}…
      </code>
      <Button type="button" size="sm" variant="ghost" onClick={onCopy}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
