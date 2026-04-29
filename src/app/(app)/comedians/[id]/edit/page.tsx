import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { ComedianForm } from "../../comedian-form";
import { updateComedianAction } from "../../actions";

export default async function EditComedianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [c] = await db
    .select()
    .from(comedians)
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)))
    .limit(1);
  if (!c) notFound();

  const action = updateComedianAction.bind(null, c.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={c.stageName}
        title="Edit comedian"
        actions={
          <Link href={`/comedians/${c.id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />
      <ComedianForm
        comedian={c}
        action={action}
        submitLabel="Save changes"
      />
    </div>
  );
}
