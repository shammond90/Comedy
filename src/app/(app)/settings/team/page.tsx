import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, orgMembers } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canInvite, getOrgRole, isOwner } from "@/lib/permissions";
import { resolveUserProfiles } from "@/lib/users";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH } from "@/components/ui/table";
import { InviteForm } from "./invite-form";
import { MemberRow, InviteRow } from "./row-controls";

export default async function TeamSettingsPage() {
  const { user, orgId } = await requireOrg();
  const orgRole = await getOrgRole(user.id, orgId);
  const canManage = canInvite(orgRole?.role ?? null);

  const members = await db
    .select({
      userId: orgMembers.userId,
      role: orgMembers.role,
      canViewFinancials: orgMembers.canViewFinancials,
      createdAt: orgMembers.createdAt,
    })
    .from(orgMembers)
    .where(eq(orgMembers.orgId, orgId))
    .orderBy(desc(orgMembers.createdAt));

  const memberProfiles = await resolveUserProfiles(members.map((m) => m.userId));

  const pending = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      token: invitations.token,
      tourId: invitations.tourId,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.orgId, orgId),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
        isNull(invitations.tourId),
      ),
    )
    .orderBy(desc(invitations.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Team"
        description="Manage who has access to your organisation."
        sticky={false}
      />

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite someone</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteForm scope="org" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
              {members.map((m) => (
                <MemberRow
                  key={m.userId}
                  userId={m.userId}
                  email={memberProfiles.get(m.userId)?.email ?? null}
                  displayName={memberProfiles.get(m.userId)?.displayName ?? null}
                  isCurrent={m.userId === user.id}
                  role={m.role}
                  canViewFinancials={m.canViewFinancials}
                  isOwner={m.role === "owner"}
                  canManage={canManage && !isOwner(m.role)}
                />
              ))}
            </TBody>
          </Table>
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
