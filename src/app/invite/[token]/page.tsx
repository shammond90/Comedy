import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, organisations, tours } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AcceptForm } from "./accept-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [inv] = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      tourId: invitations.tourId,
      orgId: invitations.orgId,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      revokedAt: invitations.revokedAt,
      orgName: organisations.name,
      tourName: tours.name,
    })
    .from(invitations)
    .leftJoin(organisations, eq(invitations.orgId, organisations.id))
    .leftJoin(tours, eq(invitations.tourId, tours.id))
    .where(eq(invitations.token, token))
    .limit(1);

  if (!inv) {
    return (
      <Centered>
        <h1 className="text-2xl font-display">Invitation not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The link may be mistyped or the invitation may have been revoked.
        </p>
      </Centered>
    );
  }

  if (inv.revokedAt) {
    return (
      <Centered>
        <h1 className="text-2xl font-display">Invitation revoked</h1>
        <p className="text-sm text-muted-foreground mt-2">
          This invitation is no longer active.
        </p>
      </Centered>
    );
  }

  if (inv.acceptedAt) {
    return (
      <Centered>
        <h1 className="text-2xl font-display">Already accepted</h1>
        <p className="text-sm text-muted-foreground mt-2">
          This invitation has already been used.
        </p>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="accent">Go to dashboard</Button>
        </Link>
      </Centered>
    );
  }

  if (inv.expiresAt.getTime() < new Date().getTime()) {
    return (
      <Centered>
        <h1 className="text-2xl font-display">Invitation expired</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Ask whoever sent you the link to generate a new one.
        </p>
      </Centered>
    );
  }

  // Check auth state
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Centered>
      <p className="text-xs uppercase tracking-wider text-subtle mb-2">
        You&apos;re invited
      </p>
      <h1 className="text-2xl font-display">
        {inv.tourId ? `Join ${inv.tourName ?? "a tour"}` : `Join ${inv.orgName ?? "an organisation"}`}
      </h1>
      <p className="text-sm text-muted-foreground mt-2">
        Role:{" "}
        <span className="font-medium capitalize text-foreground">{inv.role}</span>
        {inv.tourId
          ? ` · on tour "${inv.tourName ?? ""}"`
          : ` · in "${inv.orgName ?? ""}"`}
      </p>

      <div className="mt-6">
        {user ? (
          <AcceptForm token={token} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="flex justify-center gap-2">
              <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>
                <Button variant="accent">Sign in</Button>
              </Link>
              <Link href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}>
                <Button variant="outline">Create account</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center rounded-xl border border-border bg-surface p-8">
        {children}
      </div>
    </div>
  );
}
