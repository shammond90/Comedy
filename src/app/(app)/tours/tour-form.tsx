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
import { tourStatusOptions, tourSchema } from "./schema";
import type { ActionState } from "./actions";
import type { Tour, Comedian } from "@/db/schema";

type Props = {
  tour?: Tour;
  comedians: Pick<Comedian, "id" | "stageName">[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
};

export function TourForm({ tour, comedians, action, submitLabel }: Props) {
  const [serverState, setServerState] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();
  const t = tour;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tourSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      name: t?.name ?? "",
      comedianId: t?.comedianId ?? "",
      status: (t?.status ?? "planning") as
        | "planning"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled",
      startDate: t?.startDate ?? "",
      endDate: t?.endDate ?? "",
      description: t?.description ?? "",
      marketingCopy: t?.marketingCopy ?? "",
      pressRelease: t?.pressRelease ?? "",
      photoAssetsNotes: t?.photoAssetsNotes ?? "",
      socialCopyTemplate: t?.socialCopyTemplate ?? "",
      budget: t?.budgetPence != null ? (t.budgetPence / 100).toFixed(2) : "",
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
          <CardTitle>Tour basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Tour name" error={errors.name?.message ?? fe.name?.[0]}>
            <Input {...register("name")} required />
          </Field>
          <Field
            label="Comedian"
            error={errors.comedianId?.message ?? fe.comedianId?.[0]}
          >
            <Select {...register("comedianId")} required>
              <option value="">Select a comedian…</option>
              {comedians.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.stageName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" error={errors.status?.message ?? fe.status?.[0]}>
            <Select {...register("status")}>
              {tourStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Budget"
            hint="Total tour budget (optional)"
            error={errors.budget?.message ?? fe.budget?.[0]}
          >
            <MoneyInput
              name="budget"
              defaultValue={
                t?.budgetPence != null ? (t.budgetPence / 100).toFixed(2) : ""
              }
              onValueChange={(v) =>
                setValue("budget", v, { shouldValidate: true })
              }
            />
          </Field>
          <Field label="Start date">
            <Input type="date" {...register("startDate")} />
          </Field>
          <Field label="End date">
            <Input type="date" {...register("endDate")} />
          </Field>
          <Field
            label="Description"
            error={errors.description?.message ?? fe.description?.[0]}
          >
            <Textarea {...register("description")} rows={3} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Marketing copy">
            <Textarea {...register("marketingCopy")} rows={4} />
          </Field>
          <Field label="Press release">
            <Textarea {...register("pressRelease")} rows={4} />
          </Field>
          <Field label="Photo assets" hint="Links or notes for press photos">
            <Textarea {...register("photoAssetsNotes")} rows={2} />
          </Field>
          <Field label="Social media template">
            <Textarea {...register("socialCopyTemplate")} rows={3} />
          </Field>
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
