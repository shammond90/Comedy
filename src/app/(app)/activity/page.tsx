import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { activityLog } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { ActivityList, type ActivityRow } from "@/components/app/activity-list";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const { user, orgId } = await requireOrg();
  const rows = await db
    .select({
      id: activityLog.id,
      createdAt: activityLog.createdAt,
      action: activityLog.action,
      resourceType: activityLog.resourceType,
      resourceId: activityLog.resourceId,
      summary: activityLog.summary,
      changes: activityLog.changes,
      userId: activityLog.userId,
    })
    .from(activityLog)
    .where(eq(activityLog.orgId, orgId))
    .orderBy(desc(activityLog.createdAt))
    .limit(100);

  const list: ActivityRow[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    action: r.action,
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    summary: r.summary,
    changes: r.changes,
    actorEmail: r.userId === user.id ? "You" : "A teammate",
  }));

  return (
    <>
      <PageHeader title="Activity" description="Recent changes across your workspace." />
      <Card>
        <CardHeader>
          <CardTitle>Last 100 events</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityList rows={list} />
        </CardContent>
      </Card>
    </>
  );
}
