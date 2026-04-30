import Link from "next/link";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canEdit, getOrgRole, visibleTourCondition } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/ui/pill";
import { formatDate } from "@/lib/utils";

export default async function ToursPage() {
  const { user, orgId } = await requireOrg();
  const orgRole = await getOrgRole(user.id, orgId);
  const canCreate = canEdit(orgRole?.role ?? null);

  const visibility = await visibleTourCondition(user.id);
  const where = visibility
    ? and(isNull(tours.archivedAt), visibility)
    : isNull(tours.archivedAt);

  const rows = await db
    .select({
      id: tours.id,
      name: tours.name,
      status: tours.status,
      startDate: tours.startDate,
      endDate: tours.endDate,
      comedianName: comedians.stageName,
    })
    .from(tours)
    .leftJoin(comedians, eq(tours.comedianId, comedians.id))
    .where(where)
    .orderBy(asc(tours.startDate));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Production"
        title="Tours"
        description={`${rows.length} ${rows.length === 1 ? "tour" : "tours"} in flight`}
        actions={
          canCreate ? (
            <Link href="/tours/new">
              <Button variant="accent">Add tour</Button>
            </Link>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tours yet. Create your first tour to start scheduling shows.
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Comedian</TH>
                <TH>Dates</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((t) => (
                <TR key={t.id}>
                  <TD>
                    <Link
                      href={`/tours/${t.id}`}
                      className="font-medium hover:underline"
                    >
                      {t.name}
                    </Link>
                  </TD>
                  <TD>{t.comedianName ?? "—"}</TD>
                  <TD>
                    {formatDate(t.startDate)} – {formatDate(t.endDate)}
                  </TD>
                  <TD>
                    <StatusPill status={t.status} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
