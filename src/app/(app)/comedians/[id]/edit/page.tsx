import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canEdit, canForceUnlock, getOrgRole } from "@/lib/permissions";
import { acquireLock } from "@/lib/edit-lock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  EditLockGuard,
  LockedNotice,
} from "@/components/app/edit-lock-guard";
import { ComedianForm } from "../../comedian-form";
import { updateComedianAction } from "../../actions";
import { resolveUserProfiles } from "@/lib/users";

export default async function EditComedianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, orgId } = await requireOrg();

  const orgRole = await getOrgRole(user.id, orgId);
  if (!orgRole || !canEdit(orgRole.role)) notFound();

  const [c] = await db
    .select()
    .from(comedians)
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)))
    .limit(1);
  if (!c) notFound();

  const lock = await acquireLock({
    resourceType: "comedian",
    resourceId: c.id,
    orgId,
    userId: user.id,
  });

  const detailUrl = `/comedians/${c.id}`;
  const action = updateComedianAction.bind(null, c.id);

  if (!lock.acquired) {
    const profiles = await resolveUserProfiles([lock.userId]);
    const profile = profiles.get(lock.userId);
    const holderName = profile?.displayName ?? profile?.email ?? "Another user";
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={c.stageName}
          title="Edit comedian"
          actions={
            <Link href={detailUrl}>
              <Button variant="outline">Cancel</Button>
            </Link>
          }
        />
        <LockedNotice
          resourceType="comedian"
          resourceId={c.id}
          holderName={holderName}
          expiresAt={lock.expiresAt.toISOString()}
          detailUrl={detailUrl}
          canForceUnlock={canForceUnlock(orgRole.role)}
        />
      </div>
    );
  }

  return (
    <EditLockGuard resourceType="comedian" resourceId={c.id} detailUrl={detailUrl}>
      <div className="space-y-6">
        <PageHeader
          eyebrow={c.stageName}
          title="Edit comedian"
          actions={
            <Link href={detailUrl}>
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
    </EditLockGuard>
  );
}
