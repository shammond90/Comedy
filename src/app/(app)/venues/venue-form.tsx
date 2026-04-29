"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { venueTypeOptions, venueSchema } from "./schema";
import type { ActionState } from "./actions";
import type { Venue } from "@/db/schema";

type Props = {
  venue?: Venue;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
};

export function VenueForm({ venue, action, submitLabel }: Props) {
  const [serverState, setServerState] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();
  const v = venue;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(venueSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      name: v?.name ?? "",
      venueType: (v?.venueType ?? "comedy_club") as
        | "comedy_club"
        | "theatre"
        | "arena"
        | "arts_centre"
        | "pub"
        | "other",
      addressLine1: v?.addressLine1 ?? "",
      addressLine2: v?.addressLine2 ?? "",
      city: v?.city ?? "", // required
      postcode: v?.postcode ?? "",
      country: v?.country ?? "United Kingdom",
      capacity: (v?.capacity ?? "") as number | "",
      capacityNotes: v?.capacityNotes ?? "",
      primaryContactName: v?.primaryContactName ?? "",
      primaryContactRole: v?.primaryContactRole ?? "",
      primaryContactPhone: v?.primaryContactPhone ?? "",
      primaryContactEmail: v?.primaryContactEmail ?? "",
      secondaryContactName: v?.secondaryContactName ?? "",
      secondaryContactRole: v?.secondaryContactRole ?? "",
      secondaryContactPhone: v?.secondaryContactPhone ?? "",
      secondaryContactEmail: v?.secondaryContactEmail ?? "",
      technicalContactName: v?.technicalContactName ?? "",
      technicalContactPhone: v?.technicalContactPhone ?? "",
      technicalContactEmail: v?.technicalContactEmail ?? "",
      stageDimensions: v?.stageDimensions ?? "",
      loadInDetails: v?.loadInDetails ?? "",
      parkingInfo: v?.parkingInfo ?? "",
      notes: v?.notes ?? "",
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

  const fe = serverState.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Venue name" error={errors.name?.message ?? fe.name?.[0]}>
            <Input {...register("name")} required />
          </Field>
          <Field label="Type" error={errors.venueType?.message ?? fe.venueType?.[0]}>
            <Select {...register("venueType")}>
              {venueTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Capacity" error={errors.capacity?.message ?? fe.capacity?.[0]}>
            <Input type="number" min={0} {...register("capacity")} />
          </Field>
          <Field label="Capacity notes" hint="e.g. seated: 300, standing: 450">
            <Input {...register("capacityNotes")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Address line 1"><Input {...register("addressLine1")} /></Field>
          <Field label="Address line 2"><Input {...register("addressLine2")} /></Field>
          <Field label="City" error={errors.city?.message}><Input {...register("city")} /></Field>
          <Field label="Postcode"><Input {...register("postcode")} /></Field>
          <Field label="Country"><Input {...register("country")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Primary contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><Input {...register("primaryContactName")} /></Field>
          <Field label="Role"><Input {...register("primaryContactRole")} /></Field>
          <Field label="Phone"><Input {...register("primaryContactPhone")} /></Field>
          <Field label="Email" error={errors.primaryContactEmail?.message ?? fe.primaryContactEmail?.[0]}>
            <Input type="email" {...register("primaryContactEmail")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secondary contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><Input {...register("secondaryContactName")} /></Field>
          <Field label="Role"><Input {...register("secondaryContactRole")} /></Field>
          <Field label="Phone"><Input {...register("secondaryContactPhone")} /></Field>
          <Field label="Email" error={errors.secondaryContactEmail?.message ?? fe.secondaryContactEmail?.[0]}>
            <Input type="email" {...register("secondaryContactEmail")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><Input {...register("technicalContactName")} /></Field>
          <Field label="Phone"><Input {...register("technicalContactPhone")} /></Field>
          <Field label="Email" error={errors.technicalContactEmail?.message ?? fe.technicalContactEmail?.[0]}>
            <Input type="email" {...register("technicalContactEmail")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Stage dimensions"><Input {...register("stageDimensions")} /></Field>
          <Field label="Load-in details"><Textarea {...register("loadInDetails")} rows={3} /></Field>
          <Field label="Parking information"><Textarea {...register("parkingInfo")} rows={2} /></Field>
          <Field label="Notes"><Textarea {...register("notes")} rows={4} /></Field>
        </CardContent>
      </Card>

      {serverState.error && (
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
