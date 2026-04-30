"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";

type ServerAction = (formData: FormData) => Promise<void>;

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

function useSubmitForm(action: ServerAction) {
  const [isPending, start] = useTransition();
  const submit = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    start(async () => {
      await action(fd);
    });
  };
  return { isPending, submit };
}

/* -------------------------------------------------------------------------- */
/* Accommodation                                                              */
/* -------------------------------------------------------------------------- */

const accommodationSchema = z.object({
  hotelName: z.string().trim().optional(),
  cost: z.string().trim().optional(),
  address: z.string().trim().optional(),
  bookingReference: z.string().trim().optional(),
  checkIn: z.string().trim().optional(),
  checkInTime: z.string().trim().optional(),
  checkOut: z.string().trim().optional(),
  checkOutTime: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export function AddAccommodationForm({
  tourId,
  showId,
  action,
}: {
  tourId: string;
  showId: string;
  action: ServerAction;
}) {
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSubmitForm(action);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accommodationSchema),
    mode: "onBlur",
    defaultValues: {
      hotelName: "",
      cost: "",
      address: "",
      bookingReference: "",
      checkIn: "",
      checkInTime: "",
      checkOut: "",
      checkOutTime: "",
      contactPhone: "",
      notes: "",
    },
  });

  return (
    <details
      className="rounded-lg border border-dashed border-border p-4"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer text-sm font-medium select-none">
        + Add accommodation
      </summary>
      <form
        onSubmit={handleSubmit((_d, e) => submit(e!.target as HTMLFormElement))}
        className="grid gap-3 md:grid-cols-2 mt-3"
      >
        <input type="hidden" name="tourId" value={tourId} />
        <input type="hidden" name="showId" value={showId} />
        <Field label="Hotel name" error={errors.hotelName?.message}>
          <Input {...register("hotelName")} />
        </Field>
        <Field label="Cost" error={errors.cost?.message}>
          <MoneyInput
            name="cost"
            onValueChange={(v) => setValue("cost", v, { shouldValidate: true })}
          />
        </Field>
        <Field label="Address"><Input {...register("address")} /></Field>
        <Field label="Booking reference"><Input {...register("bookingReference")} /></Field>
        <Field label="Check-in date"><Input type="date" {...register("checkIn")} /></Field>
        <Field label="Check-in time"><Input type="time" {...register("checkInTime")} /></Field>
        <Field label="Check-out date"><Input type="date" {...register("checkOut")} /></Field>
        <Field label="Check-out time"><Input type="time" {...register("checkOutTime")} /></Field>
        <Field label="Contact phone"><Input {...register("contactPhone")} /></Field>
        <Field label="Notes"><Input {...register("notes")} /></Field>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding…" : "Add"}
          </Button>
        </div>
      </form>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Travel                                                                     */
/* -------------------------------------------------------------------------- */

const travelSchema = z.object({
  travelType: z.enum(["train", "car", "flight", "tour_bus", "other"]),
  cost: z.string().trim().optional(),
  departureLocation: z.string().trim().optional(),
  departureAt: z.string().trim().optional(),
  arrivalLocation: z.string().trim().optional(),
  arrivalAt: z.string().trim().optional(),
  bookingReference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export function AddTravelForm({
  tourId,
  showId,
  action,
}: {
  tourId: string;
  showId: string;
  action: ServerAction;
}) {
  const { isPending, submit } = useSubmitForm(action);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(travelSchema),
    mode: "onBlur",
    defaultValues: {
      travelType: "train" as const,
      cost: "",
      departureLocation: "",
      departureAt: "",
      arrivalLocation: "",
      arrivalAt: "",
      bookingReference: "",
      notes: "",
    },
  });

  return (
    <details className="rounded-lg border border-dashed border-border p-4">
      <summary className="cursor-pointer text-sm font-medium select-none">
        + Add travel
      </summary>
      <form
        onSubmit={handleSubmit((_d, e) => submit(e!.target as HTMLFormElement))}
        className="grid gap-3 md:grid-cols-2 mt-3"
      >
        <input type="hidden" name="tourId" value={tourId} />
        <input type="hidden" name="showId" value={showId} />
        <Field label="Type">
          <Select {...register("travelType")}>
            <option value="train">Train</option>
            <option value="car">Car</option>
            <option value="flight">Flight</option>
            <option value="tour_bus">Tour bus</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Cost" error={errors.cost?.message}>
          <MoneyInput
            name="cost"
            onValueChange={(v) => setValue("cost", v, { shouldValidate: true })}
          />
        </Field>
        <Field label="From"><Input {...register("departureLocation")} /></Field>
        <Field label="Departure date/time">
          <Input type="datetime-local" {...register("departureAt")} />
        </Field>
        <Field label="To"><Input {...register("arrivalLocation")} /></Field>
        <Field label="Arrival date/time">
          <Input type="datetime-local" {...register("arrivalAt")} />
        </Field>
        <Field label="Booking reference"><Input {...register("bookingReference")} /></Field>
        <Field label="Notes"><Input {...register("notes")} /></Field>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding…" : "Add"}
          </Button>
        </div>
      </form>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Reminder                                                                   */
/* -------------------------------------------------------------------------- */

const reminderSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: z.string().trim().min(1),
  dueAt: z.string().trim().min(1, "Due date is required"),
  notes: z.string().trim().optional(),
});

export function AddReminderForm({
  tourId,
  showId,
  action,
  typeOptions,
}: {
  tourId: string;
  showId: string;
  action: ServerAction;
  typeOptions: { value: string; label: string }[];
}) {
  const { isPending, submit } = useSubmitForm(action);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reminderSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      type: "custom",
      dueAt: "",
      notes: "",
    },
  });

  return (
    <details className="rounded-lg border border-dashed border-border p-4">
      <summary className="cursor-pointer text-sm font-medium select-none">
        + Add reminder
      </summary>
      <form
        onSubmit={handleSubmit((_d, e) => submit(e!.target as HTMLFormElement))}
        className="grid gap-3 md:grid-cols-2 mt-3"
      >
        <input type="hidden" name="tourId" value={tourId} />
        <input type="hidden" name="showId" value={showId} />
        <Field label="Title" error={errors.title?.message}>
          <Input {...register("title")} required />
        </Field>
        <Field label="Type">
          <Select {...register("type")}>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due" error={errors.dueAt?.message}>
          <Input type="datetime-local" {...register("dueAt")} required />
        </Field>
        <Field label="Notes">
          <Textarea {...register("notes")} rows={2} />
        </Field>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding…" : "Add reminder"}
          </Button>
        </div>
      </form>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Serialisable row types (safe to cross the server→client boundary)         */
/* -------------------------------------------------------------------------- */

export type AccommodationRow = {
  id: string;
  hotelName: string | null;
  address: string | null;
  checkIn: string | null;
  checkInTime: string | null;
  checkOut: string | null;
  checkOutTime: string | null;
  bookingReference: string | null;
  contactPhone: string | null;
  costPence: number | null;
  notes: string | null;
};

export type TravelRow = {
  id: string;
  travelType: string;
  departureLocation: string | null;
  /** ISO string or null */
  departureAt: string | null;
  arrivalLocation: string | null;
  /** ISO string or null */
  arrivalAt: string | null;
  bookingReference: string | null;
  costPence: number | null;
  notes: string | null;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function penceToDisplay(p: number | null | undefined): string {
  if (p == null) return "";
  return (p / 100).toFixed(2);
}

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${dy}T${h}:${mi}`;
}

function formatTimePart(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDatePart(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function dayDelta(depIso: string | null, arrIso: string | null): number {
  if (!depIso || !arrIso) return 0;
  const dep = new Date(depIso);
  const arr = new Date(arrIso);
  // Compare calendar dates (local)
  const depDay = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
  const arrDay = new Date(arr.getFullYear(), arr.getMonth(), arr.getDate());
  return Math.round((arrDay.getTime() - depDay.getTime()) / 86_400_000);
}

function formatPenceDisplay(p: number | null | undefined): string {
  if (p == null) return "—";
  return `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function travelTypeLabel(t: string): string {
  return t.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

/* -------------------------------------------------------------------------- */
/* Edit: Accommodation                                                        */
/* -------------------------------------------------------------------------- */

function EditAccommodationForm({
  row,
  tourId,
  showId,
  action,
  onCancel,
}: {
  row: AccommodationRow;
  tourId: string;
  showId: string;
  action: ServerAction;
  onCancel: () => void;
}) {
  const { isPending, submit } = useSubmitForm(action);
  const { register, handleSubmit, setValue } = useForm({
    resolver: zodResolver(accommodationSchema),
    defaultValues: {
      hotelName: row.hotelName ?? "",
      cost: penceToDisplay(row.costPence),
      address: row.address ?? "",
      bookingReference: row.bookingReference ?? "",
      checkIn: row.checkIn ?? "",
      checkInTime: row.checkInTime ? row.checkInTime.slice(0, 5) : "",
      checkOut: row.checkOut ?? "",
      checkOutTime: row.checkOutTime ? row.checkOutTime.slice(0, 5) : "",
      contactPhone: row.contactPhone ?? "",
      notes: row.notes ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((_d, e) => submit(e!.target as HTMLFormElement))}
      className="grid gap-3 md:grid-cols-2 p-4 bg-muted/30 rounded-lg border border-border"
    >
      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="tourId" value={tourId} />
      <input type="hidden" name="showId" value={showId} />
      <Field label="Hotel name"><Input {...register("hotelName")} /></Field>
      <Field label="Cost">
        <MoneyInput
          name="cost"
          defaultValue={penceToDisplay(row.costPence)}
          onValueChange={(v) => setValue("cost", v)}
        />
      </Field>
      <Field label="Address"><Input {...register("address")} /></Field>
      <Field label="Booking reference"><Input {...register("bookingReference")} /></Field>
      <Field label="Check-in date"><Input type="date" {...register("checkIn")} /></Field>
      <Field label="Check-in time"><Input type="time" {...register("checkInTime")} /></Field>
      <Field label="Check-out date"><Input type="date" {...register("checkOut")} /></Field>
      <Field label="Check-out time"><Input type="time" {...register("checkOutTime")} /></Field>
      <Field label="Contact phone"><Input {...register("contactPhone")} /></Field>
      <Field label="Notes"><Input {...register("notes")} /></Field>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Accommodations section (manages per-row edit state)                       */
/* -------------------------------------------------------------------------- */

export function AccommodationsSection({
  accommodations,
  tourId,
  showId,
  addAction,
  updateAction,
  deleteAction,
}: {
  accommodations: AccommodationRow[];
  tourId: string;
  showId: string;
  addAction: ServerAction;
  updateAction: ServerAction;
  deleteAction: ServerAction;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isPending: deletePending, submit: submitDelete } = useSubmitForm(deleteAction);

  return (
    <div className="space-y-4">
      {accommodations.length > 0 && (
        <div className="rounded-md border border-border divide-y divide-border">
          {accommodations.map((a) =>
            editingId === a.id ? (
              <div key={a.id} className="p-3">
                <EditAccommodationForm
                  row={a}
                  tourId={tourId}
                  showId={showId}
                  action={updateAction}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div key={a.id} className="flex items-start justify-between gap-4 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{a.hotelName ?? "—"}</p>
                  {a.address && <p className="text-xs text-muted-foreground">{a.address}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.checkIn && a.checkOut
                      ? `${fmtDateStr(a.checkIn)}${a.checkInTime ? ` ${fmtTime(a.checkInTime)}` : ""} – ${fmtDateStr(a.checkOut)}${a.checkOutTime ? ` ${fmtTime(a.checkOutTime)}` : ""}`
                      : a.checkIn
                        ? `Check-in: ${fmtDateStr(a.checkIn)}${a.checkInTime ? ` ${fmtTime(a.checkInTime)}` : ""}`
                        : a.checkOut
                          ? `Check-out: ${fmtDateStr(a.checkOut)}${a.checkOutTime ? ` ${fmtTime(a.checkOutTime)}` : ""}`
                          : "Dates TBC"}
                    {a.bookingReference ? `  ·  Ref: ${a.bookingReference}` : ""}
                    {a.costPence != null ? `  ·  ${formatPenceDisplay(a.costPence)}` : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(a.id)}
                  >
                    Edit
                  </Button>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitDelete(e.currentTarget);
                    }}
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="tourId" value={tourId} />
                    <input type="hidden" name="showId" value={showId} />
                    <Button type="submit" variant="ghost" size="sm" disabled={deletePending}>
                      Remove
                    </Button>
                  </form>
                </div>
              </div>
            )
          )}
        </div>
      )}
      <AddAccommodationForm tourId={tourId} showId={showId} action={addAction} />
    </div>
  );
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return "";
  // "HH:mm:ss" -> "HH:mm"
  return t.slice(0, 5);
}

function fmtDateStr(s: string | null | undefined): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return s;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

/* -------------------------------------------------------------------------- */
/* Edit: Travel                                                               */
/* -------------------------------------------------------------------------- */

function EditTravelForm({
  row,
  tourId,
  showId,
  action,
  onCancel,
}: {
  row: TravelRow;
  tourId: string;
  showId: string;
  action: ServerAction;
  onCancel: () => void;
}) {
  const { isPending, submit } = useSubmitForm(action);
  const { register, handleSubmit, setValue } = useForm({
    resolver: zodResolver(travelSchema),
    defaultValues: {
      travelType: row.travelType as "train" | "car" | "flight" | "tour_bus" | "other",
      cost: penceToDisplay(row.costPence),
      departureLocation: row.departureLocation ?? "",
      departureAt: isoToDatetimeLocal(row.departureAt),
      arrivalLocation: row.arrivalLocation ?? "",
      arrivalAt: isoToDatetimeLocal(row.arrivalAt),
      bookingReference: row.bookingReference ?? "",
      notes: row.notes ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((_d, e) => submit(e!.target as HTMLFormElement))}
      className="grid gap-3 md:grid-cols-2 p-4 bg-muted/30 rounded-lg border border-border"
    >
      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="tourId" value={tourId} />
      <input type="hidden" name="showId" value={showId} />
      <Field label="Type">
        <Select {...register("travelType")}>
          <option value="train">Train</option>
          <option value="car">Car</option>
          <option value="flight">Flight</option>
          <option value="tour_bus">Tour bus</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <Field label="Cost">
        <MoneyInput
          name="cost"
          defaultValue={penceToDisplay(row.costPence)}
          onValueChange={(v) => setValue("cost", v)}
        />
      </Field>
      <Field label="From"><Input {...register("departureLocation")} /></Field>
      <Field label="Departure date/time">
        <Input type="datetime-local" {...register("departureAt")} />
      </Field>
      <Field label="To"><Input {...register("arrivalLocation")} /></Field>
      <Field label="Arrival date/time">
        <Input type="datetime-local" {...register("arrivalAt")} />
      </Field>
      <Field label="Booking reference"><Input {...register("bookingReference")} /></Field>
      <Field label="Notes"><Input {...register("notes")} /></Field>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Travel section (manages per-row edit state + rich display)                */
/* -------------------------------------------------------------------------- */

export function TravelSection({
  travelRows,
  tourId,
  showId,
  addAction,
  updateAction,
  deleteAction,
}: {
  travelRows: TravelRow[];
  tourId: string;
  showId: string;
  addAction: ServerAction;
  updateAction: ServerAction;
  deleteAction: ServerAction;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isPending: deletePending, submit: submitDelete } = useSubmitForm(deleteAction);

  return (
    <div className="space-y-4">
      {travelRows.length > 0 && (
        <div className="rounded-md border border-border divide-y divide-border">
          {travelRows.map((tr) =>
            editingId === tr.id ? (
              <div key={tr.id} className="p-3">
                <EditTravelForm
                  row={tr}
                  tourId={tourId}
                  showId={showId}
                  action={updateAction}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div key={tr.id} className="flex items-start gap-4 p-3">
                {/* Date column */}
                <div className="w-16 shrink-0 text-xs text-muted-foreground pt-0.5 text-center">
                  {formatDatePart(tr.departureAt) ?? "—"}
                </div>

                {/* Type */}
                <div className="w-16 shrink-0 text-sm font-medium pt-0.5">
                  {travelTypeLabel(tr.travelType)}
                </div>

                {/* From → To with times */}
                <div className="flex-1 flex items-start gap-2 min-w-0">
                  <div className="text-center min-w-[72px]">
                    <p className="text-sm font-medium leading-tight">{tr.departureLocation ?? "—"}</p>
                    {tr.departureAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTimePart(tr.departureAt)}</p>
                    )}
                  </div>
                  <span className="text-muted-foreground pt-0.5 shrink-0">→</span>
                  <div className="text-center min-w-[72px]">
                    <p className="text-sm font-medium leading-tight">{tr.arrivalLocation ?? "—"}</p>
                    {tr.arrivalAt && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                        {formatTimePart(tr.arrivalAt)}
                        {(() => {
                          const delta = dayDelta(tr.departureAt, tr.arrivalAt);
                          if (delta === 0) return null;
                          return (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded px-1">
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          );
                        })()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ref + cost */}
                <div className="shrink-0 text-right text-xs text-muted-foreground space-y-0.5">
                  {tr.bookingReference && <p>{tr.bookingReference}</p>}
                  {tr.costPence != null && <p className="tabular-nums">{formatPenceDisplay(tr.costPence)}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(tr.id)}
                  >
                    Edit
                  </Button>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitDelete(e.currentTarget);
                    }}
                  >
                    <input type="hidden" name="id" value={tr.id} />
                    <input type="hidden" name="tourId" value={tourId} />
                    <input type="hidden" name="showId" value={showId} />
                    <Button type="submit" variant="ghost" size="sm" disabled={deletePending}>
                      Remove
                    </Button>
                  </form>
                </div>
              </div>
            )
          )}
        </div>
      )}
      <AddTravelForm tourId={tourId} showId={showId} action={addAction} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tickets card (est + actual — shown when show is completed)                */
/* -------------------------------------------------------------------------- */

function penceToInput(v: number | null | undefined) {
  return v != null ? (v / 100).toFixed(2) : "";
}

export type TicketsData = {
  ticketPricePence: number | null;
  ticketCapacity: number | null;
  estTicketsSold: number | null;
  estTicketsSoldPct: string | null;
  ticketsSold: number;
  ticketsComped: number;
  actualRevenuePence: number | null;
  actualTicketPricePence: number | null;
};

export function TicketsCard({
  tourId,
  showId,
  data,
  showStatus,
  action,
}: {
  tourId: string;
  showId: string;
  data: TicketsData;
  showStatus: string;
  action: ServerAction;
}) {
  const isCompleted = showStatus === "completed";
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  // Estimated section state
  const [estCount, setEstCount] = useState(data.estTicketsSold?.toString() ?? "");
  const [estPct, setEstPct] = useState(data.estTicketsSoldPct?.toString() ?? "");
  const [estPrice, setEstPrice] = useState(penceToInput(data.ticketPricePence));
  const cap = data.ticketCapacity ?? 0;

  // Calculated est. revenue (pence)
  const estRevenue =
    estCount !== "" && estPrice !== ""
      ? Number(estCount) * Math.round(Number(estPrice) * 100)
      : null;

  function handleEstCountChange(val: string) {
    setEstCount(val);
    if (cap > 0 && val !== "") {
      setEstPct(((Number(val) / cap) * 100).toFixed(1));
    } else {
      setEstPct("");
    }
  }
  function handleEstPctChange(val: string) {
    setEstPct(val);
    if (cap > 0 && val !== "") {
      setEstCount(String(Math.round((Number(val) / 100) * cap)));
    } else {
      setEstCount("");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("estTicketsSold", estCount);
    fd.set("estTicketsSoldPct", estPct);
    start(async () => {
      await action(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="tourId" value={tourId} />
      <input type="hidden" name="showId" value={showId} />

      {/* Capacity — read-only */}
      {cap > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{cap.toLocaleString()}</span>
          <span>capacity</span>
        </div>
      )}

      {/* Estimated section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Estimated (pre-show)
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Est. ticket price">
            <MoneyInput
              name="ticketPrice"
              defaultValue={penceToInput(data.ticketPricePence)}
              onValueChange={(v) => setEstPrice(v)}
            />
          </Field>
          <Field
            label="Est. total revenue"
            hint="Ticket price × est. tickets sold"
          >
            <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm tabular-nums text-muted-foreground">
              {estRevenue != null
                ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(estRevenue / 100)
                : "—"}
            </div>
          </Field>
          <Field label="Est. tickets sold">
            <Input
              type="number"
              min={0}
              name="estTicketsSold"
              value={estCount}
              onChange={(e) => handleEstCountChange(e.target.value)}
            />
          </Field>
          <Field
            label="Est. % of capacity"
            hint={cap > 0 && estPct ? `≈ ${Math.round((Number(estPct) / 100) * cap)} tickets` : undefined}
          >
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              name="estTicketsSoldPct"
              value={estPct}
              onChange={(e) => handleEstPctChange(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Actual section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Actual (post-show)
        </p>
        {isCompleted ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Actual revenue overrides estimates for P&amp;L calculations.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tickets sold (count)">
                <Input
                  type="number"
                  min={0}
                  name="ticketsSold"
                  defaultValue={data.ticketsSold || ""}
                />
              </Field>
              <Field label="Tickets comped (count)">
                <Input
                  type="number"
                  min={0}
                  name="ticketsComped"
                  defaultValue={data.ticketsComped || ""}
                />
              </Field>
              <Field label="Actual ticket price" hint="For reference only">
                <MoneyInput
                  name="actualTicketPrice"
                  defaultValue={penceToInput(data.actualTicketPricePence)}
                  onValueChange={() => {}}
                />
              </Field>
              <Field label="Actual total revenue" hint="Enter the real total — not calculated">
                <MoneyInput
                  name="actualRevenue"
                  defaultValue={penceToInput(data.actualRevenuePence)}
                  onValueChange={() => {}}
                />
              </Field>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Mark the show as <strong>Completed</strong> to enter actual ticket numbers and revenue.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save tickets"}
        </Button>
        {saved && <span className="text-xs text-muted-foreground">Saved ✓</span>}
      </div>
    </form>
  );
}
