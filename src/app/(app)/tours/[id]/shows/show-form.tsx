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
  venues: Pick<Venue, "id" | "name" | "city" | "country" | "capacity">[];
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

  const [capacityVal, setCapacityVal] = useState(s?.ticketCapacity?.toString() ?? "");
  const [quickAddCityError, setQuickAddCityError] = useState("");
  const [quickAddCountryError, setQuickAddCountryError] = useState("");

  const [selectedVenueId, setSelectedVenueId] = useState(s?.venueId ?? p.venueId ?? "");
  const [selectedCountry, setSelectedCountry] = useState(
    () => venues.find((v) => v.id === (s?.venueId ?? p.venueId ?? ""))?.country ?? p.country ?? ""
  );
  const [selectedCity, setSelectedCity] = useState(s?.city ?? p.city ?? "");

  const uniqueCountries = [...new Set(
    venues.map((v) => v.country).filter((c): c is string => !!c),
  )].sort();

  const uniqueCities = [...new Set(
    venues
      .filter((v) => !selectedCountry || v.country === selectedCountry)
      .map((v) => v.city)
      .filter((c): c is string => !!c),
  )].sort();

  const filteredVenues = venues.filter((v) =>
    (!selectedCountry || v.country === selectedCountry) &&
    (!selectedCity || v.city === selectedCity)
  );

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
      country: venues.find((v) => v.id === (s?.venueId ?? p.venueId ?? ""))?.country ?? p.country ?? "",
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
      ticketCapacity:
        s?.ticketCapacity?.toString() ?? p.ticketCapacity ?? "",
      marketingBudget: s
        ? penceToInput(s.marketingBudgetPence)
        : (p.marketingBudget ?? ""),
      marketingCopy: s?.marketingCopy ?? p.marketingCopy ?? "",
      marketingNotes: s?.marketingNotes ?? p.marketingNotes ?? "",
      newVenueName: "",
      newVenueCountry: "",
      newVenueCity: "",
      newVenueCapacity: "",
    },
  });

  const onSubmit = handleSubmit((_data, event) => {
    if (quickAdd) {
      const form = event!.target as HTMLFormElement;
      const countryField = form.elements.namedItem("newVenueCountry") as HTMLInputElement | null;
      const cityField = form.elements.namedItem("newVenueCity") as HTMLInputElement | null;
      let hasError = false;
      if (!countryField?.value?.trim()) {
        setQuickAddCountryError("Country is required");
        hasError = true;
      } else {
        setQuickAddCountryError("");
      }
      if (!cityField?.value?.trim()) {
        setQuickAddCityError("City is required");
        hasError = true;
      } else {
        setQuickAddCityError("");
      }
      if (hasError) return;
    }
    setQuickAddCityError("");
    setQuickAddCountryError("");
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
          {/* Row 1: Date | Status */}
          <Field label="Date" error={errors.showDate?.message ?? fe.showDate?.[0]}>
            <Input type="date" {...register("showDate")} />
          </Field>
          <Field label="Status" error={errors.status?.message ?? fe.status?.[0]}>
            <Select {...register("status")}>
              {showStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>

          {/* Row 2: Country | City */}
          <Field label="Country">
            <Select
              {...register("country")}
              value={selectedCountry}
              onChange={(e) => {
                const country = e.target.value;
                setSelectedCountry(country);
                setValue("country", country, { shouldValidate: true });
                // Clear city/venue if they no longer match
                if (selectedCity) {
                  const cityStillValid = venues.some(
                    (v) => v.city === selectedCity && (!country || v.country === country)
                  );
                  if (!cityStillValid) {
                    setSelectedCity("");
                    setValue("city", "", { shouldValidate: true });
                    setSelectedVenueId("");
                    setValue("venueId", "", { shouldValidate: true });
                  }
                }
                if (selectedVenueId) {
                  const venue = venues.find((v) => v.id === selectedVenueId);
                  if (venue && country && venue.country !== country) {
                    setSelectedVenueId("");
                    setValue("venueId", "", { shouldValidate: true });
                  }
                }
              }}
            >
              <option value="">— All countries —</option>
              {uniqueCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="City">
            <Select
              {...register("city")}
              value={selectedCity}
              onChange={(e) => {
                const city = e.target.value;
                setSelectedCity(city);
                setValue("city", city, { shouldValidate: true });
                // Auto-select country if unique for this city
                if (city) {
                  const matchingCountries = [...new Set(
                    venues.filter((v) => v.city === city).map((v) => v.country).filter(Boolean)
                  )];
                  if (matchingCountries.length === 1) {
                    setSelectedCountry(matchingCountries[0] as string);
                    setValue("country", matchingCountries[0] as string, { shouldValidate: true });
                  }
                }
                // Clear venue if it's not in this city
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

          {/* Row 3: Venue | Capacity */}
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
                  if (venue?.country) {
                    setSelectedCountry(venue.country);
                    setValue("country", venue.country, { shouldValidate: true });
                  }
                  if (venue?.city) {
                    setSelectedCity(venue.city);
                    setValue("city", venue.city, { shouldValidate: true });
                  }
                  if (venue?.capacity != null) {
                    setCapacityVal(venue.capacity.toString());
                    setValue("ticketCapacity", venue.capacity.toString(), { shouldValidate: true });
                  }
                }}
                disabled={quickAdd}
              >
                <option value="">— Select a venue —</option>
                {filteredVenues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
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
                  <Input {...register("newVenueName")} placeholder="Venue name" />
                  <div>
                    <Input
                      {...register("newVenueCountry")}
                      placeholder="Country *"
                      aria-required="true"
                    />
                    {quickAddCountryError && (
                      <p className="text-xs text-destructive mt-1">{quickAddCountryError}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      {...register("newVenueCity")}
                      placeholder="City *"
                      aria-required="true"
                    />
                    {quickAddCityError && (
                      <p className="text-xs text-destructive mt-1">{quickAddCityError}</p>
                    )}
                  </div>
                  <Input
                    {...register("newVenueCapacity")}
                    type="number"
                    min={0}
                    placeholder="Capacity (optional)"
                  />
                  <p className="text-xs text-muted-foreground">
                    A minimal venue record will be created. Edit it later in Venues for full details.
                  </p>
                </div>
              )}
            </div>
          </Field>
          <Field label="Capacity" hint="Pre-filled from venue; override per show">
            <Input
              type="number"
              min={0}
              {...register("ticketCapacity")}
              value={capacityVal}
              onChange={(e) => {
                setCapacityVal(e.target.value);
                setValue("ticketCapacity", e.target.value);
              }}
            />
          </Field>

          {/* Remaining fields */}
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
            <Input type="url" {...register("contractUrl")} placeholder="https://…" />
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
