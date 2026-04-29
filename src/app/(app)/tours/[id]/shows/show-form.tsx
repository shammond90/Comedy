"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  showStatusOptions,
  settlementTypeOptions,
  showSchema,
} from "./schema";
import type { ActionState } from "./actions";
import type { Show, Venue } from "@/db/schema";

type Prefill = Partial<{
  venueId: string;
  city: string;
  showTime: string;
  doorsTime: string;
  supportAct: string;
  contractUrl: string;
  notes: string;
  status: string;
  venueHireFee: string;
  venueDeposit: string;
  settlementType: string;
  settlementSplitPercent: string;
  settlementGuarantee: string;
  ticketPrice: string;
  ticketCapacity: string;
  marketingBudget: string;
  marketingCopy: string;
  marketingNotes: string;
}>;

type Props = {
  show?: Show;
  prefill?: Prefill;
  venues: Pick<Venue, "id" | "name" | "city">[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
};

function penceToInput(v: number | null | undefined) {
  return v != null ? (v / 100).toFixed(2) : "";
}

export function ShowForm({
  show,
  prefill,
  venues,
  action,
  submitLabel,
}: Props) {
  const [serverState, setServerState] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();
  const [quickAdd, setQuickAdd] = useState(false);
  const s = show;
  const p = prefill ?? {};

  // For est % ↔ count calculation helper
  const [estCount, setEstCount] = useState(s?.estTicketsSold?.toString() ?? "");
  const [estPct, setEstPct] = useState(s?.estTicketsSoldPct?.toString() ?? "");
  const [capacityVal, setCapacityVal] = useState(s?.ticketCapacity?.toString() ?? "");

  const [selectedVenueId, setSelectedVenueId] = useState(s?.venueId ?? p.venueId ?? "");
  const [selectedCity, setSelectedCity] = useState(s?.city ?? p.city ?? "");

  const uniqueCities = [...new Set(
    venues.map((v) => v.city).filter((c): c is string => !!c),
  )].sort();

  const filteredVenues = selectedCity
    ? venues.filter((v) => v.city === selectedCity)
    : venues;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(showSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      showDate: s?.showDate ?? "",
      status: (s?.status ?? p.status ?? "planned") as
        | "planned"
        | "contacted"
        | "booked"
        | "rider_sent"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "unavailable",
      venueId: s?.venueId ?? p.venueId ?? "",
      city: s?.city ?? p.city ?? "",
      doorsTime: s?.doorsTime ?? p.doorsTime ?? "",
      showTime: s?.showTime ?? p.showTime ?? "",
      supportAct: s?.supportAct ?? p.supportAct ?? "",
      contractUrl: s?.contractUrl ?? p.contractUrl ?? "",
      notes: s?.notes ?? p.notes ?? "",
      venueHireFee: s ? penceToInput(s.venueHireFeePence) : (p.venueHireFee ?? ""),
      venueDeposit: s ? penceToInput(s.venueDepositPence) : (p.venueDeposit ?? ""),
      settlementType: (s?.settlementType ?? p.settlementType ?? "") as
        | ""
        | "flat_fee"
        | "split"
        | "guarantee"
        | "guarantee_vs_split",
      settlementSplitPercent:
        s?.settlementSplitPercent ?? p.settlementSplitPercent ?? "",
      settlementGuarantee: s
        ? penceToInput(s.settlementGuaranteePence)
        : (p.settlementGuarantee ?? ""),
      ticketPrice: s ? penceToInput(s.ticketPricePence) : (p.ticketPrice ?? ""),
      ticketCapacity:
        s?.ticketCapacity?.toString() ?? p.ticketCapacity ?? "",
      estTicketsSold: s?.estTicketsSold?.toString() ?? "",
      estTicketsSoldPct: s?.estTicketsSoldPct?.toString() ?? "",
      ticketsSold: s?.ticketsSold?.toString() ?? "0",
      ticketsComped: s?.ticketsComped?.toString() ?? "0",
      marketingBudget: s
        ? penceToInput(s.marketingBudgetPence)
        : (p.marketingBudget ?? ""),
      marketingCopy: s?.marketingCopy ?? p.marketingCopy ?? "",
      marketingNotes: s?.marketingNotes ?? p.marketingNotes ?? "",
      newVenueName: "",
      newVenueCity: "",
    },
  });

  const onSubmit = handleSubmit((_data, event) => {
    const formData = new FormData(event!.target as HTMLFormElement);
    startTransition(async () => {
      const result = await action({}, formData);
      if (result?.error || result?.fieldErrors) {
        setServerState(result);
      }
    });
  });

  // Merge server-side field errors with client-side (client takes precedence)
  const fe = serverState.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Show details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Date" error={errors.showDate?.message ?? fe.showDate?.[0]}>
            <Input
              type="date"
              {...register("showDate")}
            />
          </Field>
          <Field label="Status" error={errors.status?.message ?? fe.status?.[0]}>
            <Select {...register("status")}>
              {showStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Venue" error={errors.venueId?.message ?? fe.venueId?.[0]}>
            <div className="space-y-2">
              <Select
                {...register("venueId")}
                value={selectedVenueId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedVenueId(id);
                  setValue("venueId", id, { shouldValidate: true });
                  const venue = venues.find((v) => v.id === id);
                  if (venue?.city) {
                    setSelectedCity(venue.city);
                    setValue("city", venue.city, { shouldValidate: true });
                  }
                }}
                disabled={quickAdd}
              >
                <option value="">— Select a venue —</option>
                {filteredVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setQuickAdd((v) => !v)}
                className="text-xs text-muted-foreground underline"
              >
                {quickAdd ? "Cancel quick add" : "+ Quick-add a new venue"}
              </button>
              {quickAdd && (
                <div className="grid gap-2 rounded-md border border-dashed border-border p-3">
                  <Input
                    {...register("newVenueName")}
                    placeholder="Venue name"
                  />
                  <Input
                    {...register("newVenueCity")}
                    placeholder="City (optional)"
                  />
                  <p className="text-xs text-muted-foreground">
                    A minimal venue record will be created. Edit it later in
                    Venues for full details.
                  </p>
                </div>
              )}
            </div>
          </Field>
          <Field label="City">
            <Select
              {...register("city")}
              value={selectedCity}
              onChange={(e) => {
                const city = e.target.value;
                setSelectedCity(city);
                setValue("city", city, { shouldValidate: true });
                // If the selected venue isn't in this city, clear it
                if (selectedVenueId) {
                  const venue = venues.find((v) => v.id === selectedVenueId);
                  if (venue && venue.city !== city) {
                    setSelectedVenueId("");
                    setValue("venueId", "", { shouldValidate: true });
                  }
                }
              }}
            >
              <option value="">— All cities —</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Doors time">
            <Input type="time" {...register("doorsTime")} />
          </Field>
          <Field label="Show time">
            <Input type="time" {...register("showTime")} />
          </Field>
          <Field label="Support act">
            <Input {...register("supportAct")} />
          </Field>
          <Field
            label="Contract URL"
            hint="Link to the deal memo / contract document"
            error={errors.contractUrl?.message ?? fe.contractUrl?.[0]}
          >
            <Input
              type="url"
              {...register("contractUrl")}
              placeholder="https://…"
            />
          </Field>
          <Field label="Notes">
            <Textarea {...register("notes")} rows={3} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venue financial terms</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Venue hire fee" error={errors.venueHireFee?.message ?? fe.venueHireFee?.[0]}>
            <MoneyInput
              name="venueHireFee"
              defaultValue={s ? penceToInput(s.venueHireFeePence) : (p.venueHireFee ?? "")}
              onValueChange={(v) => setValue("venueHireFee", v, { shouldValidate: true })}
            />
          </Field>
          <Field label="Venue deposit" error={errors.venueDeposit?.message ?? fe.venueDeposit?.[0]}>
            <MoneyInput
              name="venueDeposit"
              defaultValue={s ? penceToInput(s.venueDepositPence) : (p.venueDeposit ?? "")}
              onValueChange={(v) => setValue("venueDeposit", v, { shouldValidate: true })}
            />
          </Field>
          <Field label="Deposit paid">
            <label className="flex h-10 items-center gap-2">
              <input
                type="checkbox"
                name="venueDepositPaid"
                defaultChecked={s?.venueDepositPaid ?? false}
              />
              <span className="text-sm">Paid</span>
            </label>
          </Field>
          <Field label="Settlement type">
            <Select {...register("settlementType")}>
              {settlementTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Split %">
            <Input
              {...register("settlementSplitPercent")}
              inputMode="decimal"
              placeholder="e.g. 80"
            />
          </Field>
          <Field label="Guarantee" error={errors.settlementGuarantee?.message ?? fe.settlementGuarantee?.[0]}>
            <MoneyInput
              name="settlementGuarantee"
              defaultValue={s ? penceToInput(s.settlementGuaranteePence) : (p.settlementGuarantee ?? "")}
              onValueChange={(v) => setValue("settlementGuarantee", v, { shouldValidate: true })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ticketing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base info */}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Ticket price (listed)" error={errors.ticketPrice?.message ?? fe.ticketPrice?.[0]}>
              <MoneyInput
                name="ticketPrice"
                defaultValue={s ? penceToInput(s.ticketPricePence) : (p.ticketPrice ?? "")}
                onValueChange={(v) => setValue("ticketPrice", v, { shouldValidate: true })}
              />
            </Field>
            <Field label="Capacity">
              <Input
                type="number"
                min={0}
                {...register("ticketCapacity")}
                onChange={(e) => {
                  setValue("ticketCapacity", e.target.value);
                  setCapacityVal(e.target.value);
                  // Recalculate count from pct if pct is set
                  if (estPct && e.target.value) {
                    const cap = Number(e.target.value);
                    const count = Math.round((Number(estPct) / 100) * cap);
                    setEstCount(String(count));
                    setValue("estTicketsSold", String(count));
                  }
                }}
              />
            </Field>
          </div>

          {/* Estimated */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Estimated (pre-show)
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Est. tickets sold">
                <Input
                  type="number"
                  min={0}
                  {...register("estTicketsSold")}
                  value={estCount}
                  onChange={(e) => {
                    setEstCount(e.target.value);
                    setValue("estTicketsSold", e.target.value);
                    // Back-calculate pct
                    const cap = Number(capacityVal);
                    if (cap > 0 && e.target.value !== "") {
                      const pct = ((Number(e.target.value) / cap) * 100).toFixed(1);
                      setEstPct(pct);
                      setValue("estTicketsSoldPct", pct);
                    } else {
                      setEstPct("");
                      setValue("estTicketsSoldPct", "");
                    }
                  }}
                />
              </Field>
              <Field
                label="Est. % of capacity"
                hint={capacityVal ? `${Math.round((Number(estPct) / 100) * Number(capacityVal)) || ""} tickets` : undefined}
              >
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  {...register("estTicketsSoldPct")}
                  value={estPct}
                  onChange={(e) => {
                    setEstPct(e.target.value);
                    setValue("estTicketsSoldPct", e.target.value);
                    // Forward-calculate count
                    const cap = Number(capacityVal);
                    if (cap > 0 && e.target.value !== "") {
                      const count = Math.round((Number(e.target.value) / 100) * cap);
                      setEstCount(String(count));
                      setValue("estTicketsSold", String(count));
                    } else {
                      setEstCount("");
                      setValue("estTicketsSold", "");
                    }
                  }}
                />
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local marketing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Marketing budget" error={errors.marketingBudget?.message ?? fe.marketingBudget?.[0]}>
            <MoneyInput
              name="marketingBudget"
              defaultValue={s ? penceToInput(s.marketingBudgetPence) : (p.marketingBudget ?? "")}
              onValueChange={(v) => setValue("marketingBudget", v, { shouldValidate: true })}
            />
          </Field>
          <Field label="Marketing copy">
            <Textarea {...register("marketingCopy")} rows={4} />
          </Field>
          <Field label="Marketing notes">
            <Textarea {...register("marketingNotes")} rows={3} />
          </Field>
        </CardContent>
      </Card>

      {(serverState.error) && (
        <p className="text-sm text-destructive">{serverState.error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
