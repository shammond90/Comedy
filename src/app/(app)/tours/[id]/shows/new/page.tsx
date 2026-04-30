import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { ShowForm } from "../show-form";
import { createShowAction } from "../actions";

export default async function NewShowPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: tourId } = await params;
  const sp = await searchParams;
  const prefill: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") prefill[k] = v;
  }
  const { orgId } = await requireOrg();

  const [t] = await db
    .select({ id: tours.id, name: tours.name })
    .from(tours)
    .where(and(eq(tours.id, tourId), eq(tours.orgId, orgId)))
    .limit(1);
  if (!t) notFound();

  const venueRows = await db
    .select({ id: venues.id, name: venues.name, city: venues.city, capacity: venues.capacity })
    .from(venues)
    .where(and(eq(venues.orgId, orgId), isNull(venues.archivedAt)))
    .orderBy(asc(venues.name));

  const action = createShowAction.bind(null, tourId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.name}
        title="New show"
        actions={
          <Link href={`/tours/${tourId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />
      <ShowForm
        venues={venueRows}
        prefill={prefill}
        action={action}
        submitLabel="Create show"
      />
    </div>
  );
}
