import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { activityLog, shows } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import {
  isOrgMember,
  listCollabTourIdsForOrg,
} from "@/lib/permissions";
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

  const conds = [eq(activityLog.orgId, orgId)];

  // Collab-only users see only activity for their accessible tours/shows.
  if (!(await isOrgMember(user.id, orgId))) {
    const tourIds = await listCollabTourIdsForOrg(user.id, orgId);
    if (tourIds.length === 0) {
      conds.push(eq(activityLog.id, "00000000-0000-0000-0000-000000000000"));
    } else {
      const showRows = await db
        .select({ id: shows.id })
        .from(shows)
        .where(and(eq(shows.orgId, orgId), inArray(shows.tourId, tourIds)));
      const showIds = showRows.map((r) => r.id);
      const allowed = [
        and(
          eq(activityLog.resourceType, "tour"),
          inArray(activityLog.resourceId, tourIds),
        ),
        ...(showIds.length > 0
          ? [
              and(
                eq(activityLog.resourceType, "show"),
                inArray(activityLog.resourceId, showIds),
              ),
            ]
          : []),
      ];
      conds.push(or(...allowed)!);
    }
  }

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
    .where(and(...conds))
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
