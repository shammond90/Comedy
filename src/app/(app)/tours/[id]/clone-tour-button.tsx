"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cloneTourAction } from "../actions";

export function CloneTourButton({
  tourId,
  sourceName,
  sourceStartDate,
}: {
  tourId: string;
  sourceName: string;
  sourceStartDate: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Duplicate
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Duplicate tour</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Copies shows, tasks, and reminders. Ticket sales, settlements,
              accommodation, and travel are not copied.
            </p>
            <form action={cloneTourAction} className="mt-4 space-y-3">
              <input type="hidden" name="tourId" value={tourId} />
              <div className="space-y-1">
                <Label htmlFor="newName">New tour name</Label>
                <Input
                  id="newName"
                  name="newName"
                  defaultValue={`${sourceName} (copy)`}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newStartDate">
                  New start date{" "}
                  <span className="text-muted-foreground">
                    (shifts every show + reminder by the same offset)
                  </span>
                </Label>
                <Input
                  id="newStartDate"
                  name="newStartDate"
                  type="date"
                  defaultValue={sourceStartDate ?? ""}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Duplicate</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
