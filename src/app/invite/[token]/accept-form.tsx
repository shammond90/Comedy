"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "@/app/(app)/settings/team/actions";

export function AcceptForm({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="accent"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await acceptInviteAction(token);
            if (r.ok) router.push(r.redirectTo);
            else setError(r.error);
          })
        }
      >
        {pending ? "Accepting…" : "Accept invitation"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
