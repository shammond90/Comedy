"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  heartbeatLockAction,
  releaseLockAction,
} from "@/lib/edit-lock-actions";
import type { LockResourceType } from "@/db/schema";

const HEARTBEAT_MS = 60_000; // 60s
const IDLE_MS = 5 * 60_000;   // 5 min

/**
 * Wraps an edit form. On mount: starts heartbeat + idle timer + Realtime
 * subscription. On idle/lost-lock/force-unlock: redirects back to detailUrl.
 *
 * The lock MUST already be acquired server-side before rendering this guard
 * (the page does that in its server component).
 */
export function EditLockGuard({
  resourceType,
  resourceId,
  detailUrl,
  children,
}: {
  resourceType: LockResourceType;
  resourceId: string;
  detailUrl: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [warning, setWarning] = useState<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beaconArmedRef = useRef(true);

  // Bail out: redirect back to read-only view + clear lock.
  function abort(reason: string) {
    if (!beaconArmedRef.current) return;
    beaconArmedRef.current = false;
    setWarning(reason);
    // Best-effort release; navigation will fire beforeunload too but that's a no-op once already released.
    void releaseLockAction(resourceType, resourceId);
    setTimeout(() => router.push(detailUrl), 600);
  }

  function resetIdle() {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      abort("You've been inactive — the edit lock has been released.");
    }, IDLE_MS);
  }

  useEffect(() => {
    resetIdle();

    // Heartbeat
    const hbInterval = setInterval(async () => {
      const r = await heartbeatLockAction(resourceType, resourceId);
      if (!r.ok) abort("Lock lost — someone else is now editing this.");
    }, HEARTBEAT_MS);

    // Idle activity tracking (throttled)
    let lastActivity = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 5_000) return;
      lastActivity = now;
      resetIdle();
    };
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("click", onActivity);

    // Realtime subscription — react to DELETE (force-unlock) or UPDATE by other user.
    const supabase = createClient();
    const channel = supabase
      .channel(`edit-lock:${resourceType}:${resourceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "edit_locks",
          filter: `resource_id=eq.${resourceId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            abort("An admin force-released your lock.");
            return;
          }
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const row = payload.new as { user_id?: string; resource_type?: string };
            if (row.resource_type !== resourceType) return;
            // If somebody else is now the owner, we lost the lock.
            // We can't easily compare to current user id from the client without
            // shipping it in props — relying on the heartbeat to detect this is
            // fine, but for snappier UX we trigger an immediate heartbeat.
            void heartbeatLockAction(resourceType, resourceId).then((r) => {
              if (!r.ok && row.user_id) {
                abort("Lock lost — someone else is now editing this.");
              }
            });
          }
        },
      )
      .subscribe();

    // Best-effort release on tab close.
    const onUnload = () => {
      if (!beaconArmedRef.current) return;
      const body = JSON.stringify({ resourceType, resourceId });
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/edit-locks/release", blob);
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(hbInterval);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("beforeunload", onUnload);
      supabase.removeChannel(channel);
      // Component is unmounting (route navigation in-app) — release the lock.
      if (beaconArmedRef.current) {
        beaconArmedRef.current = false;
        void releaseLockAction(resourceType, resourceId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, resourceId, detailUrl]);

  return (
    <>
      {warning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-destructive bg-destructive text-destructive-foreground px-4 py-2 text-sm shadow-lg">
          {warning}
        </div>
      )}
      {children}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Locked notice                               */
/* -------------------------------------------------------------------------- */

export function LockedNotice({
  resourceType,
  resourceId,
  holderId,
  expiresAt,
  detailUrl,
  canForceUnlock,
}: {
  resourceType: LockResourceType;
  resourceId: string;
  holderId: string;
  expiresAt: string;
  detailUrl: string;
  canForceUnlock: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [now, setNow] = useState(() => new Date().getTime());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date().getTime()), 30_000);
    return () => clearInterval(i);
  }, []);
  const minsLeft = Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - now) / 60_000),
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-4 max-w-lg mx-auto text-center">
      <div className="text-2xl">🔒</div>
      <h2 className="font-display text-xl">This page is being edited</h2>
      <p className="text-sm text-muted-foreground">
        Locked by user{" "}
        <span className="font-mono text-xs">{holderId.slice(0, 8)}…</span>
        {" · "}
        expires in ~{minsLeft} min
      </p>
      <div className="flex justify-center gap-2 pt-2">
        <button
          onClick={() => router.push(detailUrl)}
          className="rounded-lg border border-border-strong bg-surface px-4 py-2 text-sm hover:bg-muted"
        >
          Back
        </button>
        {canForceUnlock && (
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const { forceReleaseLockAction } = await import(
                  "@/lib/edit-lock-actions"
                );
                const r = await forceReleaseLockAction(
                  resourceType,
                  resourceId,
                );
                if (r.ok) router.refresh();
              })
            }
            className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Unlocking…" : "Force unlock"}
          </button>
        )}
      </div>
    </div>
  );
}
