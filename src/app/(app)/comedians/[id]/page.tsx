import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteComedianAction } from "../actions";

export default async function ComedianDetailPage({
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comedian"
        title={c.stageName}
        description={c.legalName ?? undefined}
        actions={
          <>
            <Link href={`/comedians/${c.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <form action={deleteComedianAction}>
              <input type="hidden" name="id" value={c.id} />
              <Button type="submit" variant="destructive" formNoValidate>
                Archive
              </Button>
            </form>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {c.email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {c.phone ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Representation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Agent:</span>{" "}
              {c.agentName ?? "—"}
              {c.agentCompany && ` (${c.agentCompany})`}
            </p>
            <p>
              <span className="text-muted-foreground">Manager:</span>{" "}
              {c.managerName ?? "—"}
              {c.managerCompany && ` (${c.managerCompany})`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hospitality rider</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {c.hospitalityRider ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical rider</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {c.technicalRider ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {c.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{c.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
