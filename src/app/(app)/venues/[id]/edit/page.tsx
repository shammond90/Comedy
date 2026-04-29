import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { VenueForm } from "../../venue-form";
import { updateVenueAction } from "../../actions";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [v] = await db
    .select()
    .from(venues)
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)))
    .limit(1);
  if (!v) notFound();

  const action = updateVenueAction.bind(null, v.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={v.name}
        title="Edit venue"
        actions={
          <Link href={`/venues/${v.id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />
      <VenueForm venue={v} action={action} submitLabel="Save changes" />
    </div>
  );
}
