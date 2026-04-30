"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyableLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-3 space-y-2">
      <p className="text-xs text-muted-foreground">
        Send this link to the invitee. It expires in 14 days.
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 h-9 rounded-md border border-border bg-background px-2 text-xs font-mono"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
