import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteVenueAction } from "../actions";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [v] = await db
    .select()
    .from(venues)
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)))
    .limit(1);
  if (!v) notFound();

  const fields: Array<[string, string | number | null]> = [
    ["Type", v.venueType.replace(/_/g, " ")],
    ["Capacity", v.capacity ?? "—"],
    ["Capacity notes", v.capacityNotes],
    ["Address", [v.addressLine1, v.addressLine2, v.city, v.postcode, v.country]
      .filter(Boolean)
      .join(", ") || "—"],
    ["Primary contact", v.primaryContactName],
    ["Phone", v.primaryContactPhone],
    ["Email", v.primaryContactEmail],
    ["Stage dimensions", v.stageDimensions],
    ["Load-in", v.loadInDetails],
    ["Parking", v.parkingInfo],
    ["Notes", v.notes],
  ];

  const hasSecondary =
    v.secondaryContactName ||
    v.secondaryContactRole ||
    v.secondaryContactPhone ||
    v.secondaryContactEmail;
  const hasTechnical =
    v.technicalContactName || v.technicalContactPhone || v.technicalContactEmail;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={v.venueType.replace(/_/g, " ")}
        title={v.name}
        description={v.city ?? undefined}
        actions={
          <>
            <Link href={`/venues/${v.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <form action={deleteVenueAction}>
              <input type="hidden" name="id" value={v.id} />
              <Button
                type="submit"
                variant="destructive"
                formNoValidate
              >
                Archive
              </Button>
            </form>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {(hasSecondary || hasTechnical) && (
        <div className="grid gap-6 md:grid-cols-2">
          {hasSecondary && (
            <Card>
              <CardHeader>
                <CardTitle>Secondary contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {v.secondaryContactName && (
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {v.secondaryContactName}
                    {v.secondaryContactRole && (
                      <span className="text-muted-foreground"> · {v.secondaryContactRole}</span>
                    )}
                  </p>
                )}
                {v.secondaryContactPhone && (
                  <p>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {v.secondaryContactPhone}
                  </p>
                )}
                {v.secondaryContactEmail && (
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <a className="hover:underline" href={`mailto:${v.secondaryContactEmail}`}>
                      {v.secondaryContactEmail}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {hasTechnical && (
            <Card>
              <CardHeader>
                <CardTitle>Technical contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {v.technicalContactName && (
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {v.technicalContactName}
                  </p>
                )}
                {v.technicalContactPhone && (
                  <p>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {v.technicalContactPhone}
                  </p>
                )}
                {v.technicalContactEmail && (
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <a className="hover:underline" href={`mailto:${v.technicalContactEmail}`}>
                      {v.technicalContactEmail}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
