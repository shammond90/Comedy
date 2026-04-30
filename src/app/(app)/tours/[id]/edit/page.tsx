import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canEdit, canForceUnlock, getTourRole } from "@/lib/permissions";
import { acquireLock } from "@/lib/edit-lock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  EditLockGuard,
  LockedNotice,
} from "@/components/app/edit-lock-guard";
import { TourForm } from "../../tour-form";
import { updateTourAction } from "../../actions";

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireOrg();

  const tourRole = await getTourRole(user.id, id);
  if (!tourRole || !canEdit(tourRole.role)) notFound();

  const [t] = await db
    .select()
    .from(tours)
    .where(eq(tours.id, id))
    .limit(1);
  if (!t) notFound();

  const comedianRows = await db
    .select({ id: comedians.id, stageName: comedians.stageName })
    .from(comedians)
    .where(and(eq(comedians.orgId, t.orgId), isNull(comedians.archivedAt)))
    .orderBy(asc(comedians.stageName));

  const lock = await acquireLock({
    resourceType: "tour",
    resourceId: t.id,
    orgId: t.orgId,
    userId: user.id,
  });

  const detailUrl = `/tours/${t.id}`;
  const action = updateTourAction.bind(null, t.id);

  if (!lock.acquired) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={t.name}
          title="Edit tour"
          actions={
            <Link href={detailUrl}>
              <Button variant="outline">Cancel</Button>
            </Link>
          }
        />
        <LockedNotice
          resourceType="tour"
          resourceId={t.id}
          holderId={lock.userId}
          expiresAt={lock.expiresAt.toISOString()}
          detailUrl={detailUrl}
          canForceUnlock={canForceUnlock(tourRole.role)}
        />
      </div>
    );
  }

  return (
    <EditLockGuard resourceType="tour" resourceId={t.id} detailUrl={detailUrl}>
      <div className="space-y-6">
        <PageHeader
          eyebrow={t.name}
          title="Edit tour"
          actions={
            <Link href={detailUrl}>
              <Button variant="outline">Cancel</Button>
            </Link>
          }
        />
        <TourForm
          tour={t}
          comedians={comedianRows}
          action={action}
          submitLabel="Save changes"
        />
      </div>
    </EditLockGuard>
  );
}
