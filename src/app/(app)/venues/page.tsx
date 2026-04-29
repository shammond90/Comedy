import Link from "next/link";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";

export default async function VenuesPage() {
  const { orgId } = await requireOrg();
  const rows = await db
    .select()
    .from(venues)
    .where(and(eq(venues.orgId, orgId), isNull(venues.archivedAt)))
    .orderBy(asc(venues.name));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network"
        title="Venues"
        description={`${rows.length} ${rows.length === 1 ? "venue" : "venues"} on file`}
        actions={
          <Link href="/venues/new">
            <Button variant="accent">Add venue</Button>
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No venues yet. Add your first one to get started.
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>City</TH>
                <TH>Type</TH>
                <TH className="text-right">Capacity</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((v) => (
                <TR key={v.id}>
                  <TD>
                    <Link
                      href={`/venues/${v.id}`}
                      className="font-medium hover:underline"
                    >
                      {v.name}
                    </Link>
                  </TD>
                  <TD>{v.city ?? "—"}</TD>
                  <TD className="capitalize">
                    {v.venueType.replace(/_/g, " ")}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {v.capacity ?? "—"}
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
