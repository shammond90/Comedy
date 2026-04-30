import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        eyebrow="Help"
        title="User Guide"
        description="Everything you need to plan, run, and reconcile a comedy tour."
      />

      <Card>
        <CardHeader><CardTitle>Quick start</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            New here? Follow these four steps in order — each one unlocks the next.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Add your venues</strong> — Go to <em>Venues → New venue</em>.
              Country, city, and a venue name are required. Add capacity if you know it.
            </li>
            <li>
              <strong>Add your comedians</strong> — Go to <em>Comedians → New comedian</em>.
              You can record fees, contact details, and a bio.
            </li>
            <li>
              <strong>Create a tour</strong> — Go to <em>Tours → New tour</em>.
              Set a name, headliner, and tour dates.
            </li>
            <li>
              <strong>Add shows to the tour</strong> — Open the tour and click{" "}
              <em>Add show</em>. Pick the date, venue, country, and city. The form
              auto-fills city, country, and capacity from the venue you choose.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Venues</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Venues are your address book of places you can play. Each venue stores
            location, capacity, contacts, and production notes.
          </p>
          <p>
            <strong>Country</strong> and <strong>City</strong> are required — they
            power the country/city filters on the show form.
          </p>
          <p>
            <strong>Capacity</strong> is optional but recommended. When you book a
            show at this venue, the capacity pre-fills on the show form and you can
            override it per show.
          </p>
          <p>
            Use <strong>Quick-add a new venue</strong> on the show form when you need
            to capture a venue mid-flow. You can fill out full details later in the
            Venues section.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Comedians</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Comedians are the talent on your tours. Each can have a default fee,
            agency contact, photo, and bio.
          </p>
          <p>
            When you assign a comedian as the <strong>headliner</strong> of a tour,
            their default fee is used as the per-show talent cost in financial
            calculations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tours</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            A tour groups a series of shows under one banner. The tour page shows
            every show in the run with summary financials at the top (Revenue, Costs,
            Net) and a row per show.
          </p>
          <p>From the tour page you can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Add new shows to the run</li>
            <li>See per-show occupancy and financials at a glance</li>
            <li>Generate a printable Tour Book (PDF)</li>
            <li>Track estimated vs. actual revenue across the whole run</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Shows</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Each show is a single date on a tour. The show form is laid out in three rows:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Date | Status</strong> — when the show is, and where it is in
              the booking pipeline
            </li>
            <li>
              <strong>Country | City</strong> — populated from your venues; selecting
              one filters the others
            </li>
            <li>
              <strong>Venue | Capacity</strong> — venue list filtered by country &amp;
              city; capacity pre-fills from the venue
            </li>
          </ul>
          <p className="pt-1">
            <strong>Status</strong> moves through a pipeline:{" "}
            <em>
              Planned → Contacted → Booked → Rider sent → Confirmed → Completed
            </em>
            . Mark a show <em>Completed</em> after the night to unlock actual ticket
            entry.
          </p>
          <p>
            The show detail page also lets you record settlement terms,
            accommodation, travel, marketing budget, reminders, and notes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tickets — estimated vs. actual</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Open a show, then click the <strong>Tickets</strong> summary card at the
            top to go to the tickets page.
          </p>
          <p>
            <strong>Estimated (pre-show):</strong> Enter your expected ticket price
            and either the count of tickets you expect to sell or the % of capacity —
            the two fields stay in sync automatically. Est. Total Revenue is
            calculated live.
          </p>
          <p>
            <strong>Actual (post-show):</strong> Available once the show is marked{" "}
            <em>Completed</em>. Enter the real tickets sold, comps, and total revenue
            from your settlement.
          </p>
          <p>
            <strong>How financials work:</strong> If actual revenue is entered it is
            used everywhere. Otherwise the estimate is used and Revenue/Net cards
            show an <em>(Est.)</em> label so you know the figure is a projection.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Calendar</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The calendar view shows every show across all tours on a monthly grid.
            Click a show to jump straight to its detail page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dashboard</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The dashboard is your home screen — at-a-glance numbers across all
            active tours, upcoming shows, and any reminders that are due.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tips &amp; tricks</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Add a venue once, reuse it across many shows — capacity, city, and
              country flow through automatically.
            </li>
            <li>
              Use <em>Estimated</em> ticket fields early in the process to forecast
              the tour P&amp;L before any shows have happened.
            </li>
            <li>
              Settlement type (flat fee, split, guarantee) determines how venue
              revenue is calculated. Pick the closest match and the maths takes care
              of itself.
            </li>
            <li>
              Use the printable Tour Book to share a single PDF with comedians, tour
              managers, or venues.
            </li>
            <li>
              Reminders on each show let you track deadlines like rider due dates,
              marketing copy, and settlement paperwork.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
