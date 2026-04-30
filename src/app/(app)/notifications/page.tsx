import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/notifications";
import { markAllReadAction } from "@/lib/notification-actions";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function relTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toISOString().slice(0, 10);
}

async function markAll() {
  "use server";
  await markAllReadAction();
  redirect("/notifications");
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = await listNotifications(user.id, 100);
  const hasUnread = rows.some((r) => !r.readAt);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Things that happened in your workspaces."
        actions={
          hasUnread ? (
            <form action={markAll}>
              <Button type="submit" variant="ghost" size="sm">
                Mark all read
              </Button>
            </form>
          ) : undefined
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Last 100</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You&rsquo;re all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const inner = (
                  <div className="flex items-start gap-3 py-3">
                    {!r.readAt && (
                      <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{r.title}</div>
                      {r.body && (
                        <div className="text-xs text-muted-foreground">{r.body}</div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {relTime(r.createdAt)}
                    </span>
                  </div>
                );
                return (
                  <li key={r.id}>
                    {r.link ? (
                      <Link href={r.link} className="block hover:bg-accent/40">
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
