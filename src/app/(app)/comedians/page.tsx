import Link from "next/link";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";

export default async function ComediansPage() {
  const { orgId } = await requireOrg();
  const rows = await db
    .select()
    .from(comedians)
    .where(and(eq(comedians.orgId, orgId), isNull(comedians.archivedAt)))
    .orderBy(asc(comedians.stageName));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Roster"
        title="Comedians"
        description={`${rows.length} ${rows.length === 1 ? "comedian" : "comedians"} in your roster`}
        actions={
          <Link href="/comedians/new">
            <Button variant="accent">Add comedian</Button>
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comedians yet. Add one to get started.
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <THead>
              <TR>
                <TH>Stage name</TH>
                <TH>Agent</TH>
                <TH>Email</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link
                      href={`/comedians/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.stageName}
                    </Link>
                  </TD>
                  <TD>{c.agentName ?? "—"}</TD>
                  <TD>{c.email ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
