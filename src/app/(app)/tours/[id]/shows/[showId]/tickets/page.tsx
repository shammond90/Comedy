import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, shows } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { updateTickets } from "../sub-actions";
import { TicketsCard, type TicketsData } from "../sub-forms";

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ id: string; showId: string }>;
}) {
  const { id: tourId, showId } = await params;
  const { orgId } = await requireOrg();

  const [t] = await db
    .select({ id: tours.id, name: tours.name })
    .from(tours)
    .where(and(eq(tours.id, tourId), eq(tours.orgId, orgId)))
    .limit(1);
  if (!t) notFound();

  const [s] = await db
    .select()
    .from(shows)
    .where(and(eq(shows.id, showId), eq(shows.orgId, orgId)))
    .limit(1);
  if (!s) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link
            href={`/tours/${tourId}/shows/${showId}`}
            className="hover:text-foreground transition-colors"
          >
            ← Back to show
          </Link>
        }
        title="Tickets"
      />

      <Card>
        <CardHeader>
          <CardTitle>Ticket sales</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsCard
            tourId={tourId}
            showId={s.id}
            data={{
              ticketPricePence: s.ticketPricePence,
              ticketCapacity: s.ticketCapacity,
              estTicketsSold: s.estTicketsSold,
              estTicketsSoldPct: s.estTicketsSoldPct,
              ticketsSold: s.ticketsSold,
              ticketsComped: s.ticketsComped,
              actualRevenuePence: s.actualRevenuePence,
              actualTicketPricePence: s.actualTicketPricePence,
            } satisfies TicketsData}
            showStatus={s.status}
            action={updateTickets}
          />
        </CardContent>
      </Card>
    </div>
  );
}
