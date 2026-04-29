import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { TourForm } from "../tour-form";
import { createTourAction } from "../actions";

export default async function NewTourPage() {
  const { orgId } = await requireOrg();
  const comedianRows = await db
    .select({ id: comedians.id, stageName: comedians.stageName })
    .from(comedians)
    .where(and(eq(comedians.orgId, orgId), isNull(comedians.archivedAt)))
    .orderBy(asc(comedians.stageName));

  if (comedianRows.length === 0) {
    redirect("/comedians/new?next=/tours/new");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Production"
        title="New tour"
        actions={
          <Link href="/tours">
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />
      <TourForm
        comedians={comedianRows}
        action={createTourAction}
        submitLabel="Create tour"
      />
    </div>
  );
}
