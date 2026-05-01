import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canEdit, canForceUnlock, getOrgRole } from "@/lib/permissions";
import { acquireLock } from "@/lib/edit-lock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  EditLockGuard,
  LockedNotice,
} from "@/components/app/edit-lock-guard";
import { VenueForm } from "../../venue-form";
import { updateVenueAction } from "../../actions";
import { resolveUserProfiles } from "@/lib/users";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, orgId } = await requireOrg();

  const orgRole = await getOrgRole(user.id, orgId);
  if (!orgRole || !canEdit(orgRole.role)) notFound();

  const [v] = await db
    .select()
    .from(venues)
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)))
    .limit(1);
  if (!v) notFound();

  const lock = await acquireLock({
    resourceType: "venue",
    resourceId: v.id,
    orgId,
    userId: user.id,
  });

  const detailUrl = `/venues/${v.id}`;
  const action = updateVenueAction.bind(null, v.id);

  if (!lock.acquired) {
    const profiles = await resolveUserProfiles([lock.userId]);
    const profile = profiles.get(lock.userId);
    const holderName = profile?.displayName ?? profile?.email ?? "Another user";
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={v.name}
          title="Edit venue"
          actions={
            <Link href={detailUrl}>
              <Button variant="outline">Cancel</Button>
            </Link>
          }
        />
        <LockedNotice
          resourceType="venue"
          resourceId={v.id}
          holderName={holderName}
          expiresAt={lock.expiresAt.toISOString()}
          detailUrl={detailUrl}
          canForceUnlock={canForceUnlock(orgRole.role)}
        />
      </div>
    );
  }

  return (
    <EditLockGuard resourceType="venue" resourceId={v.id} detailUrl={detailUrl}>
      <div className="space-y-6">
        <PageHeader
          eyebrow={v.name}
          title="Edit venue"
          actions={
            <Link href={detailUrl}>
              <Button variant="outline">Cancel</Button>
            </Link>
          }
        />
        <VenueForm venue={v} action={action} submitLabel="Save changes" />
      </div>
    </EditLockGuard>
  );
}
