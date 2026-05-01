import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, venues, reminders, showTasks } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canEdit, getTourRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Table, TBody, TR, TD } from "@/components/ui/table";
import { formatDate, formatPence } from "@/lib/utils";
import { getShowFinancials } from "@/lib/finance";
import { reminderTypeLabels } from "@/lib/options";
import { showStatusOptions } from "../schema";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/ui/pill";
import {
  deleteShowAction,
  duplicateShowAction,
  quickUpdateStatusAction,
} from "../actions";
import {
  addAccommodation,
  updateAccommodation,
  addTravel,
  updateTravel,
  addReminder,
  completeReminder,
  deleteAccommodation,
  deleteTravel,
  deleteReminder,
} from "./sub-actions";
import {
  AccommodationsSection,
  TravelSection,
  AddReminderForm,
  type AccommodationRow,
  type TravelRow,
} from "./sub-forms";
import { ShowTasksCard } from "./tasks-card";

export default async function ShowDetailPage({
  params,
}: {
  params: Promise<{ id: string; showId: string }>;
}) {
  const { id: tourId, showId } = await params;
  const { user } = await requireOrg();

  const tourRole = await getTourRole(user.id, tourId);
  if (!tourRole) notFound();
  const userCanEdit = canEdit(tourRole.role);
  const showFinancials = tourRole.canViewFinancials;

  const [t] = await db
    .select({ id: tours.id, name: tours.name, orgId: tours.orgId })
    .from(tours)
    .where(eq(tours.id, tourId))
    .limit(1);
  if (!t) notFound();
  const orgId = t.orgId;

  const data = await getShowFinancials(orgId, showId);
  if (!data) notFound();
  const { show: s, accommodations, travel, fin } = data;

  const venueRow = s.venueId
    ? (
        await db
          .select()
          .from(venues)
          .where(and(eq(venues.id, s.venueId), eq(venues.orgId, orgId)))
          .limit(1)
      )[0]
    : null;

  const showReminders = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.orgId, orgId),
        eq(reminders.showId, showId),
      ),
    )
    .orderBy(asc(reminders.dueAt));

  const tasks = await db
    .select({
      id: showTasks.id,
      label: showTasks.label,
      done: showTasks.done,
      doneAt: showTasks.doneAt,
      doneByUserId: showTasks.doneByUserId,
    })
    .from(showTasks)
    .where(eq(showTasks.showId, showId))
    .orderBy(asc(showTasks.sortOrder));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <Link
            href={`/tours/${tourId}`}
            className="hover:text-foreground transition-colors"
          >
            ← {t.name}
          </Link>
        }
        title={
          <span className="flex items-center gap-3">
            <span>{formatDate(s.showDate)}</span>
            <StatusPill status={s.status} />
          </span>
        }
        description={
          [venueRow?.name, s.city ?? venueRow?.city]
            .filter(Boolean)
            .join(" · ") || "Venue not set"
        }
        actions={
          <>
            <Link href={`/tours/${tourId}/shows/${s.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <form action={duplicateShowAction}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="tourId" value={tourId} />
              <Button type="submit" variant="outline" formNoValidate>
                Duplicate
              </Button>
            </form>
            <form action={deleteShowAction}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="tourId" value={tourId} />
              <Button type="submit" variant="destructive" formNoValidate>
                Archive
              </Button>
            </form>
          </>
        }
      />

      {/* Quick status update */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm text-muted-foreground">Update status:</span>
          <form action={quickUpdateStatusAction} className="flex gap-2">
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="tourId" value={tourId} />
            <Select name="status" defaultValue={s.status}>
              {showStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" variant="outline">
              Update
            </Button>
          </form>
          {s.contractUrl && (
            <a
              href={s.contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm underline"
            >
              View contract ↗
            </a>
          )}
        </CardContent>
      </Card>

      {/* Financial summary */}
      {showFinancials && (
      <div className="grid gap-4 md:grid-cols-4">
        <Link href={`/tours/${tourId}/shows/${s.id}/tickets`} className="block group">
          <Card className="h-full transition-colors group-hover:border-foreground/30">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
                {fin.isEstimated ? "Tickets (Est.)" : "Tickets"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl tabular-nums">
                {fin.isEstimated
                  ? (s.estTicketsSold ?? 0)
                  : fin.ticketsSold}
                {s.ticketCapacity != null && (
                  <span className="text-base text-muted-foreground">
                    {" "}
                    / {s.ticketCapacity}
                  </span>
                )}
              </p>
              {fin.occupancyPercent != null && !fin.isEstimated && (
                <p className="text-xs text-muted-foreground mt-1">
                  {fin.occupancyPercent}% occupancy
                </p>
              )}
              {fin.isEstimated && s.estTicketsSoldPct && (
                <p className="text-xs text-muted-foreground mt-1">
                  {s.estTicketsSoldPct}% of capacity
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                Click to edit →
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
              {fin.isEstimated ? "Revenue (Est.)" : "Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl tabular-nums">
              {formatPence(fin.ticketRevenuePence)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
              Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl tabular-nums">
              {formatPence(fin.totalCostsPence)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
              {fin.isEstimated ? "Net (Est.)" : "Net"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`font-display text-3xl tabular-nums ${
                fin.netPence < 0 ? "text-destructive" : ""
              }`}
            >
              {formatPence(fin.netPence)}
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Cost breakdown table */}
      {showFinancials && (
      <Card>
        <CardHeader>
          <CardTitle>Cost breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TBody>
              <TR>
                <TD className="text-muted-foreground">Venue hire</TD>
                <TD className="text-right tabular-nums">
                  {formatPence(fin.venueFeePence)}
                </TD>
              </TR>
              <TR>
                <TD className="text-muted-foreground">Accommodation</TD>
                <TD className="text-right tabular-nums">
                  {formatPence(fin.accommodationPence)}
                </TD>
              </TR>
              <TR>
                <TD className="text-muted-foreground">Travel</TD>
                <TD className="text-right tabular-nums">
                  {formatPence(fin.travelPence)}
                </TD>
              </TR>
              <TR>
                <TD className="text-muted-foreground">Marketing</TD>
                <TD className="text-right tabular-nums">
                  {formatPence(fin.marketingPence)}
                </TD>
              </TR>
              <TR>
                <TD className="font-medium">Total</TD>
                <TD className="text-right font-medium tabular-nums">
                  {formatPence(fin.totalCostsPence)}
                </TD>
              </TR>
            </TBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {/* Accommodation */}
      <Card>
        <CardHeader>
          <CardTitle>Accommodation</CardTitle>
        </CardHeader>
        <CardContent>
          <AccommodationsSection
            accommodations={accommodations.map((a): AccommodationRow => ({
              id: a.id,
              hotelName: a.hotelName,
              address: a.address,
              checkIn: a.checkIn,
              checkInTime: a.checkInTime,
              checkOut: a.checkOut,
              checkOutTime: a.checkOutTime,
              bookingReference: a.bookingReference,
              contactPhone: a.contactPhone,
              costPence: a.costPence,
              notes: a.notes,
            }))}
            tourId={tourId}
            showId={s.id}
            addAction={addAccommodation}
            updateAction={updateAccommodation}
            deleteAction={deleteAccommodation}
          />
        </CardContent>
      </Card>

      {/* Travel */}
      <Card>
        <CardHeader>
          <CardTitle>Travel</CardTitle>
        </CardHeader>
        <CardContent>
          <TravelSection
            travelRows={travel.map((tr): TravelRow => ({
              id: tr.id,
              travelType: tr.travelType,
              departureLocation: tr.departureLocation,
              departureAt: tr.departureAt?.toISOString() ?? null,
              arrivalLocation: tr.arrivalLocation,
              arrivalAt: tr.arrivalAt?.toISOString() ?? null,
              bookingReference: tr.bookingReference,
              costPence: tr.costPence,
              notes: tr.notes,
            }))}
            tourId={tourId}
            showId={s.id}
            addAction={addTravel}
            updateAction={updateTravel}
            deleteAction={deleteTravel}
          />
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <ShowTasksCard
            showId={showId}
            tasks={tasks}
            canEdit={userCanEdit}
            currentUserId={user.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showReminders.length > 0 && (
            <ul className="divide-y divide-border rounded-md border border-border">
              {showReminders.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-center justify-between gap-4 p-3 ${r.completedAt ? "opacity-50" : ""}`}
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${r.completedAt ? "line-through" : ""}`}
                    >
                      {r.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reminderTypeLabels[r.type]} · due {formatDate(r.dueAt)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!r.completedAt && (
                      <form action={completeReminder}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="tourId" value={tourId} />
                        <input type="hidden" name="showId" value={s.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          formNoValidate
                        >
                          Done
                        </Button>
                      </form>
                    )}
                    <form action={deleteReminder}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="tourId" value={tourId} />
                      <input type="hidden" name="showId" value={s.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        formNoValidate
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AddReminderForm
            tourId={tourId}
            showId={s.id}
            action={addReminder}
            typeOptions={Object.entries(reminderTypeLabels).map(([value, label]) => ({ value, label }))}
          />
        </CardContent>
      </Card>

      {/* Marketing */}
      {(s.marketingCopy || s.marketingNotes) && (
        <Card>
          <CardHeader>
            <CardTitle>Local marketing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm whitespace-pre-wrap">
            {s.marketingCopy && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Copy
                </p>
                <p>{s.marketingCopy}</p>
              </div>
            )}
            {s.marketingNotes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Notes
                </p>
                <p>{s.marketingNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(s.notes || s.supportAct) && (
        <Card>
          <CardHeader>
            <CardTitle>Show notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {s.supportAct && (
              <p>
                <span className="text-muted-foreground">Support:</span>{" "}
                {s.supportAct}
              </p>
            )}
            {s.notes && (
              <p className="whitespace-pre-wrap">{s.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {(venueRow?.primaryContactName || venueRow?.primaryContactEmail) && (
        <Card>
          <CardHeader>
            <CardTitle>Venue contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {venueRow.primaryContactName ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {venueRow.primaryContactPhone ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {venueRow.primaryContactEmail ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
