import Link from "next/link";
import { and, asc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";

export default async function ComediansPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { orgId } = await requireOrg();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const conds = [eq(comedians.orgId, orgId), isNull(comedians.archivedAt)];
  if (q) {
    const p = `%${q}%`;
    conds.push(
      or(
        ilike(comedians.stageName, p),
        ilike(comedians.legalName, p),
        ilike(comedians.email, p),
        ilike(comedians.agentName, p),
        ilike(comedians.agentCompany, p),
        ilike(comedians.agentEmail, p),
        ilike(comedians.managerName, p),
        ilike(comedians.managerCompany, p),
        ilike(comedians.managerEmail, p),
        ilike(comedians.city, p),
        ilike(comedians.country, p),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(comedians)
    .where(and(...conds))
    .orderBy(asc(comedians.stageName));

  const hasFilters = Boolean(q);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Roster"
        title="Comedians"
        description={`${rows.length} ${rows.length === 1 ? "comedian" : "comedians"}${hasFilters ? " matched" : " in your roster"}`}
        actions={
          <Link href="/comedians/new">
            <Button variant="accent">Add comedian</Button>
          </Link>
        }
      />

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3"
      >
        <div className="flex-1 min-w-[12rem]">
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Search
          </label>
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Stage name, agent, email…"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="accent">
            Filter
          </Button>
          {hasFilters && (
            <Link href="/comedians">
              <Button type="button" variant="ghost">
                Clear
              </Button>
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {hasFilters
            ? "No comedians match that search."
            : "No comedians yet. Add one to get started."}
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
