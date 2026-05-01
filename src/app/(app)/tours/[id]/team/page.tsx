import { notFound } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, tourCollaborators, tours, comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canInvite, getTourRole } from "@/lib/permissions";
import { resolveUserProfiles } from "@/lib/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH } from "@/components/ui/table";
import { InviteForm } from "../../../settings/team/invite-form";
import { InviteRow, CollaboratorRow } from "../../../settings/team/row-controls";

export default async function TourTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireOrg();

  const tourRole = await getTourRole(user.id, id);
  if (!tourRole) notFound();
  const canManage = canInvite(tourRole.role);

  const [t] = await db
    .select({
      id: tours.id,
      name: tours.name,
      orgId: tours.orgId,
      comedianName: comedians.stageName,
    })
    .from(tours)
    .leftJoin(comedians, eq(tours.comedianId, comedians.id))
    .where(eq(tours.id, id))
    .limit(1);
  if (!t) notFound();

  const collaborators = await db
    .select({
      id: tourCollaborators.id,
      userId: tourCollaborators.userId,
      role: tourCollaborators.role,
      canViewFinancials: tourCollaborators.canViewFinancials,
    })
    .from(tourCollaborators)
    .where(eq(tourCollaborators.tourId, id))
    .orderBy(desc(tourCollaborators.createdAt));

  const collabProfiles = await resolveUserProfiles(
    collaborators.map((c) => c.userId),
  );

  const pending = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      token: invitations.token,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.tourId, id),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
    )
    .orderBy(desc(invitations.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.comedianName ?? "Tour"}
        title={`${t.name} · Team`}
        description="People with access to this tour."
        actions={
          <Link href={`/tours/${t.id}`}>
            <Button variant="outline">Back to tour</Button>
          </Link>
        }
      />

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite to this tour</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteForm scope="tour" tourId={t.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Collaborators</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {collaborators.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No per-tour collaborators yet. Org members already have access
              based on their org role.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>User</TH>
                  <TH>Role</TH>
                  <TH>Financials</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {collaborators.map((c) => (
                  <CollaboratorRow
                    key={c.id}
                    id={c.id}
                    userId={c.userId}
                    email={collabProfiles.get(c.userId)?.email ?? null}
                    displayName={collabProfiles.get(c.userId)?.displayName ?? null}
                    tourId={t.id}
                    role={c.role}
                    canViewFinancials={c.canViewFinancials}
                    canManage={canManage}
                  />
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Expires</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {pending.map((i) => (
                  <InviteRow
                    key={i.id}
                    id={i.id}
                    email={i.email}
                    role={i.role}
                    token={i.token}
                    expiresAt={i.expiresAt.toISOString()}
                    canManage={canManage}
                  />
                ))}
              </TBody>
            </Table>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
