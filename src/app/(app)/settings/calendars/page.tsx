import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { calendarTokens, tours } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { listCollabTourIds } from "@/lib/permissions";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import {
  createCalendarTokenAction,
  revokeCalendarTokenAction,
} from "./actions";
import { CalendarUrlField } from "./url-field";

export const dynamic = "force-dynamic";

export default async function CalendarsSettingsPage() {
  const { user, orgId } = await requireOrg();

  const tokens = await db
    .select()
    .from(calendarTokens)
    .where(eq(calendarTokens.userId, user.id))
    .orderBy(desc(calendarTokens.createdAt));

  // Tour list for the scope picker: own org's tours + tours shared via
  // per-tour collaboration.
  const collabTourIds = await listCollabTourIds(user.id);
  const tourRows = await db
    .select({ id: tours.id, name: tours.name })
    .from(tours)
    .where(
      collabTourIds.length > 0
        ? or(eq(tours.orgId, orgId), inArray(tours.id, collabTourIds))
        : eq(tours.orgId, orgId),
    )
    .orderBy(desc(tours.createdAt));

  return (
    <>
      <PageHeader
        title="Calendar feeds"
        description="Subscribe to your shows in Google, Apple, or any calendar app."
      />

      <Card>
        <CardHeader>
          <CardTitle>New feed</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCalendarTokenAction} className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="scope">Scope</Label>
              <Select id="scope" name="scope" defaultValue="org">
                <option value="org">All shows in workspace</option>
                <option value="tour">A specific tour</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="scopeId">Tour (if scope = tour)</Label>
              <Select id="scopeId" name="scopeId" defaultValue="">
                <option value="">—</option>
                {tourRows.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="label">Label (optional)</Label>
              <Input id="label" name="label" placeholder="My tour calendar" />
            </div>
            <div className="flex items-end">
              <Button type="submit">Generate</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your feeds</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tokens.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No calendar feeds yet.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Label</TH>
                  <TH>Scope</TH>
                  <TH>URL</TH>
                  <TH>Last used</TH>
                  <TH>Status</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {tokens.map((t) => (
                  <TR key={t.id}>
                    <TD>{t.label ?? "—"}</TD>
                    <TD className="text-sm text-muted-foreground">
                      {t.scope === "org"
                        ? "Workspace"
                        : t.scope === "tour"
                          ? "Tour"
                          : "Comedian"}
                    </TD>
                    <TD>
                      <CalendarUrlField token={t.token} />
                    </TD>
                    <TD className="text-xs text-muted-foreground">
                      {t.lastUsedAt
                        ? new Date(t.lastUsedAt).toISOString().slice(0, 16).replace("T", " ")
                        : "—"}
                    </TD>
                    <TD className="text-xs">
                      {t.revokedAt ? (
                        <span className="text-destructive">Revoked</span>
                      ) : (
                        <span className="text-emerald-600">Active</span>
                      )}
                    </TD>
                    <TD className="text-right">
                      {!t.revokedAt && (
                        <form action={revokeCalendarTokenAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Revoke
                          </Button>
                        </form>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
