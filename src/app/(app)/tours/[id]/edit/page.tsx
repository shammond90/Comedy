import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { TourForm } from "../../tour-form";
import { updateTourAction } from "../../actions";

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [t] = await db
    .select()
    .from(tours)
    .where(and(eq(tours.id, id), eq(tours.orgId, orgId)))
    .limit(1);
  if (!t) notFound();

  const comedianRows = await db
    .select({ id: comedians.id, stageName: comedians.stageName })
    .from(comedians)
    .where(and(eq(comedians.orgId, orgId), isNull(comedians.archivedAt)))
    .orderBy(asc(comedians.stageName));

  const action = updateTourAction.bind(null, t.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.name}
        title="Edit tour"
        actions={
          <Link href={`/tours/${t.id}`}>
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
  );
}
