import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, venues, shows } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canEdit, canForceUnlock, getTourRole } from "@/lib/permissions";
import { acquireLock } from "@/lib/edit-lock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  EditLockGuard,
  LockedNotice,
} from "@/components/app/edit-lock-guard";
import { ShowForm } from "../../show-form";
import { updateShowAction } from "../../actions";
import { resolveUserProfiles } from "@/lib/users";

export default async function EditShowPage({
  params,
}: {
  params: Promise<{ id: string; showId: string }>;
}) {
  const { id: tourId, showId } = await params;
  const { user } = await requireOrg();

  const tourRole = await getTourRole(user.id, tourId);
  if (!tourRole || !canEdit(tourRole.role)) notFound();

  const [t] = await db
    .select({ id: tours.id, name: tours.name, orgId: tours.orgId })
    .from(tours)
    .where(eq(tours.id, tourId))
    .limit(1);
  if (!t) notFound();

  const [s] = await db
    .select()
    .from(shows)
    .where(and(eq(shows.id, showId), eq(shows.tourId, tourId)))
    .limit(1);
  if (!s) notFound();

  const venueRows = await db
    .select({ id: venues.id, name: venues.name, city: venues.city, country: venues.country, capacity: venues.capacity })
    .from(venues)
    .where(and(eq(venues.orgId, t.orgId), isNull(venues.archivedAt)))
    .orderBy(asc(venues.name));

  const lock = await acquireLock({
    resourceType: "show",
    resourceId: s.id,
    orgId: t.orgId,
    userId: user.id,
  });

  const detailUrl = `/tours/${tourId}/shows/${showId}`;
  const action = updateShowAction.bind(null, tourId, showId);

  if (!lock.acquired) {
    const profiles = await resolveUserProfiles([lock.userId]);
    const profile = profiles.get(lock.userId);
    const holderName = profile?.displayName ?? profile?.email ?? "Another user";
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit show"
          actions={
            <Link href={detailUrl}>
              <Button variant="outline">Cancel</Button>
            </Link>
          }
        />
        <LockedNotice
          resourceType="show"
          resourceId={s.id}
          holderName={holderName}
          expiresAt={lock.expiresAt.toISOString()}
          detailUrl={detailUrl}
          canForceUnlock={canForceUnlock(tourRole.role)}
        />
      </div>
    );
  }

  return (
    <EditLockGuard resourceType="show" resourceId={s.id} detailUrl={detailUrl}>
      <div className="space-y-6">
        <PageHeader
          title="Edit show"
          actions={
            <Link href={detailUrl}>
              <Button variant="outline">Cancel</Button>
            </Link>
          }
        />
        <ShowForm
          show={s}
          venues={venueRows}
          action={action}
          submitLabel="Save changes"
          canViewFinancials={tourRole.canViewFinancials}
        />
      </div>
    </EditLockGuard>
  );
}
