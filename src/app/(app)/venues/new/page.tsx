import Link from "next/link";
import { VenueForm } from "../venue-form";
import { createVenueAction } from "../actions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";

export default function NewVenuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network"
        title="New venue"
        actions={
          <Link href="/venues">
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />
      <VenueForm action={createVenueAction} submitLabel="Create venue" />
    </div>
  );
}
