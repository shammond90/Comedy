import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, venues, shows } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { ShowForm } from "../../show-form";
import { updateShowAction } from "../../actions";

export default async function EditShowPage({
  params,
}: {
  params: Promise<{ id: string; showId: string }>;
}) {
  const { id: tourId, showId } = await params;
  const { orgId } = await requireOrg();

  const [t] = await db
    .select({ id: tours.id, name: tours.name })
    .from(tours)
    .where(and(eq(tours.id, tourId), eq(tours.orgId, orgId)))
    .limit(1);
  if (!t) notFound();

  const [s] = await db
    .select()
    .from(shows)
    .where(and(eq(shows.id, showId), eq(shows.orgId, orgId)))
    .limit(1);
  if (!s) notFound();

  const venueRows = await db
    .select({ id: venues.id, name: venues.name, city: venues.city, country: venues.country, capacity: venues.capacity })
    .from(venues)
    .where(and(eq(venues.orgId, orgId), isNull(venues.archivedAt)))
    .orderBy(asc(venues.name));

  const action = updateShowAction.bind(null, tourId, showId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit show"
        actions={
          <Link href={`/tours/${tourId}/shows/${showId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />
      <ShowForm
        show={s}
        venues={venueRows}
        action={action}
        submitLabel="Save changes"
      />
    </div>
  );
}
