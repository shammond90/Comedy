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
        <CardHeader><CardTitle>Team &amp; sharing</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Comedy is multi-user. Invite people from <em>Settings → Team</em> at
            the organisation level (access to everything) or, from a tour&apos;s{" "}
            <em>Team</em> tab, on a per-tour basis.
          </p>
          <p><strong>Roles</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Viewer</strong> — read-only access</li>
            <li><strong>Editor</strong> — can create and edit shows, tours, venues, comedians</li>
            <li><strong>Admin</strong> — can also invite team members and delete tours</li>
            <li><strong>Owner</strong> — the org creator; can transfer ownership</li>
          </ul>
          <p>
            Your effective role on a tour is the higher of your org role and any
            per-tour role you&apos;ve been granted. Tick{" "}
            <strong>Can view financials</strong> on an invite to expose money
            fields; otherwise revenue, costs and net are hidden.
          </p>
          <p>
            If the invitee already has an account, they&apos;re attached
            immediately and notified. Otherwise the invite is a shareable link
            that&apos;s valid for 14 days.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Edit locks</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            To prevent two people overwriting each other, edit pages take a{" "}
            <strong>pessimistic lock</strong>. While you&apos;re editing,
            others see a banner telling them who has the page open. Locks
            expire automatically after 5 minutes of inactivity, or when you
            navigate away.
          </p>
          <p>
            <strong>Admins</strong> can force-unlock a page if someone&apos;s
            browser crashed mid-edit.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activity &amp; notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Every change is recorded in an <strong>activity log</strong>. View
            org-wide activity at <em>/activity</em> or per-tour activity from a
            tour&apos;s <em>Activity</em> tab.
          </p>
          <p>
            The <strong>bell icon</strong> in the top right shows unread
            notifications — tour invites, shares, mentions, and reminders that
            fire. Click any item to jump straight to the relevant page; click{" "}
            <em>Mark all read</em> to clear.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Per-show task checklist</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Each show has a <strong>Tasks</strong> card on its detail page —
            lightweight checklist items like &ldquo;send rider&rdquo;, &ldquo;book
            hotel&rdquo;, &ldquo;chase settlement&rdquo;. Tick a box to mark it
            done; the tour overview shows <em>done / total</em> per show so you
            can see at a glance which dates need attention.
          </p>
          <p>Use the ↑ ↓ buttons to reorder.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cloning a tour</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            From any tour&apos;s detail page, the <strong>Clone</strong> button
            copies the entire run — shows, reminders, and tasks — to a new tour
            with a new name and start date. All dates are shifted by the same
            offset, status is reset to <em>planning</em>, and ticket sales /
            financial actuals are cleared so you can plan a follow-up run.
          </p>
          <p>
            <em>Not</em> copied: settlements, accommodation, travel — these are
            typically venue-and-date specific.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Calendar feeds (iCal)</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Subscribe to your tour schedule from Google Calendar, Apple
            Calendar, Outlook, or any iCal-compatible app. Go to{" "}
            <em>Settings → Calendars</em> and create a feed at one of three
            scopes:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Organisation</strong> — every show in your org</li>
            <li><strong>Tour</strong> — a single tour</li>
            <li><strong>Comedian</strong> — every show featuring that comedian</li>
          </ul>
          <p>
            Copy the generated URL into your calendar app&apos;s
            &ldquo;Subscribe to calendar&rdquo; option. The feed is read-only
            and refreshes every few minutes. <strong>Treat the URL like a
            password</strong> — anyone with the link can read the schedule.
            Use <em>Revoke</em> to invalidate a leaked URL; you can always
            create a new one.
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
