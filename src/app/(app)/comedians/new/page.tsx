import Link from "next/link";
import { ComedianForm } from "../comedian-form";
import { createComedianAction } from "../actions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";

export default function NewComedianPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Roster"
        title="New comedian"
        actions={
          <Link href="/comedians">
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />
      <ComedianForm
        action={createComedianAction}
        submitLabel="Create comedian"
      />
    </div>
  );
}
