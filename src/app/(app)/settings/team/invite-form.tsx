"use client";

import { useActionState, useState } from "react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type ActionState } from "@/lib/actions";
import { inviteToOrgAction, inviteToTourAction } from "./actions";
import { CopyableLink } from "./copyable-link";

type Result = ActionState & { inviteUrl?: string; attached?: boolean };

const initial: Result = {};

export function InviteForm({
  scope,
  tourId,
}: {
  scope: "org" | "tour";
  tourId?: string;
}) {
  const action = scope === "tour" ? inviteToTourAction : inviteToOrgAction;
  const [state, formAction, pending] = useActionState<Result, FormData>(
    action,
    initial,
  );
  const [reset, setReset] = useState(0);

  return (
    <div className="space-y-4">
      <form
        key={reset}
        action={(fd) => {
          if (scope === "tour" && tourId) fd.set("tourId", tourId);
          formAction(fd);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[220px] space-y-1">
          <label className="text-xs text-muted-foreground">
            Email <span className="text-subtle">(optional)</span>
          </label>
          <Input
            name="email"
            type="email"
            placeholder="someone@example.com"
            aria-invalid={!!state.fieldErrors?.email}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Role</label>
          <Select name="role" defaultValue="editor">
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input
            type="checkbox"
            name="canViewFinancials"
            value="true"
            defaultChecked={scope === "org"}
            className="h-4 w-4 rounded border-border-strong"
          />
          See financials
        </label>
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Generating…" : "Generate invite link"}
        </Button>
      </form>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {state.attached && (
        <div className="rounded-lg border border-border bg-surface-2/40 p-3 text-sm">
          That user already has an account — they&apos;ve been added directly.
          <button
            type="button"
            onClick={() => setReset((n) => n + 1)}
            className="ml-2 text-xs underline text-muted-foreground hover:text-foreground"
          >
            Invite another
          </button>
        </div>
      )}

      {state.inviteUrl && <CopyableLink url={state.inviteUrl} />}
    </div>
  );
}
