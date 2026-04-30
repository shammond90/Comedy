"use client";

import { useTransition } from "react";
import {
  changeRoleAction,
  removeMemberAction,
  removeCollaboratorAction,
  revokeInviteAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

export function MemberRow({
  userId,
  isCurrent,
  role,
  canViewFinancials,
  isOwner: ownerFlag,
  canManage,
}: {
  userId: string;
  isCurrent: boolean;
  role: string;
  canViewFinancials: boolean;
  isOwner: boolean;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm font-mono text-xs">
        {userId.slice(0, 8)}…
        {isCurrent && (
          <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent">
            you
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {ownerFlag || !canManage ? (
          <span className="capitalize text-sm">{role}</span>
        ) : (
          <Select
            defaultValue={role}
            disabled={pending}
            onChange={(e) => {
              const newRole = e.target.value;
              if (newRole === role) return;
              const fd = new FormData();
              fd.set("scope", "org");
              fd.set("id", userId);
              fd.set("role", newRole);
              start(() => changeRoleAction(fd));
            }}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </Select>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {canViewFinancials ? "Yes" : "No"}
      </td>
      <td className="px-4 py-3 text-right">
        {canManage && !ownerFlag && !isCurrent && (
          <form
            action={(fd) => start(() => removeMemberAction(fd))}
            className="inline"
          >
            <input type="hidden" name="userId" value={userId} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-destructive"
            >
              Remove
            </Button>
          </form>
        )}
      </td>
    </tr>
  );
}

export function InviteRow({
  id,
  email,
  role,
  token,
  expiresAt,
  canManage,
}: {
  id: string;
  email: string | null;
  role: string;
  token: string;
  expiresAt: string;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm">
        {email ?? <span className="text-subtle italic">link only</span>}
        <div className="text-xs text-muted-foreground font-mono mt-1">
          /invite/{token.slice(0, 12)}…
        </div>
      </td>
      <td className="px-4 py-3 text-sm capitalize">{role}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(expiresAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}
      </td>
      <td className="px-4 py-3 text-right">
        {canManage && (
          <form
            action={(fd) => start(() => revokeInviteAction(fd))}
            className="inline"
          >
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-destructive"
            >
              Revoke
            </Button>
          </form>
        )}
      </td>
    </tr>
  );
}

export function CollaboratorRow({
  id,
  userId,
  tourId,
  role,
  canViewFinancials,
  canManage,
}: {
  id: string;
  userId: string;
  tourId: string;
  role: string;
  canViewFinancials: boolean;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-xs font-mono">{userId.slice(0, 8)}…</td>
      <td className="px-4 py-3">
        {!canManage ? (
          <span className="capitalize text-sm">{role}</span>
        ) : (
          <Select
            defaultValue={role}
            disabled={pending}
            onChange={(e) => {
              const newRole = e.target.value;
              if (newRole === role) return;
              const fd = new FormData();
              fd.set("scope", "tour");
              fd.set("id", id);
              fd.set("role", newRole);
              fd.set("tourId", tourId);
              start(() => changeRoleAction(fd));
            }}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </Select>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {canViewFinancials ? "Yes" : "No"}
      </td>
      <td className="px-4 py-3 text-right">
        {canManage && (
          <form
            action={(fd) => start(() => removeCollaboratorAction(fd))}
            className="inline"
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="tourId" value={tourId} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-destructive"
            >
              Remove
            </Button>
          </form>
        )}
      </td>
    </tr>
  );
}
