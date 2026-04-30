import { notFound } from "next/navigation";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { activityLog, shows, tours } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { getTourRole } from "@/lib/permissions";
import { ActivityList, type ActivityRow } from "@/components/app/activity-list";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TourActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, orgId } = await requireOrg();

  const role = await getTourRole(user.id, id);
  if (!role) notFound();

  const [tour] = await db
    .select({ id: tours.id, name: tours.name })
    .from(tours)
    .where(and(eq(tours.id, id), eq(tours.orgId, orgId)))
    .limit(1);
  if (!tour) notFound();

  const tourShowIds = await db
    .select({ id: shows.id })
    .from(shows)
    .where(eq(shows.tourId, id));
  const showIds = tourShowIds.map((r) => r.id);

  const condition = showIds.length
    ? or(
        and(eq(activityLog.resourceType, "tour"), eq(activityLog.resourceId, id)),
        and(eq(activityLog.resourceType, "show"), inArray(activityLog.resourceId, showIds)),
      )
    : and(eq(activityLog.resourceType, "tour"), eq(activityLog.resourceId, id));

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
    .where(and(eq(activityLog.orgId, orgId), condition))
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
      <PageHeader
        eyebrow={tour.name}
        title="Activity"
        description="Recent changes to this tour and its shows."
      />
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
