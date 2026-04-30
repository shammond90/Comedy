"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { comedianSchema } from "./schema";
import type { ActionState } from "@/lib/actions";
import type { Comedian } from "@/db/schema";

type Props = {
  comedian?: Comedian;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
};

export function ComedianForm({ comedian, action, submitLabel }: Props) {
  const [serverState, setServerState] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();
  const c = comedian;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(comedianSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      stageName: c?.stageName ?? "",
      legalName: c?.legalName ?? "",
      phone: c?.phone ?? "",
      email: c?.email ?? "",
      addressLine1: c?.addressLine1 ?? "",
      addressLine2: c?.addressLine2 ?? "",
      city: c?.city ?? "",
      postcode: c?.postcode ?? "",
      country: c?.country ?? "",
      agentName: c?.agentName ?? "",
      agentCompany: c?.agentCompany ?? "",
      agentPhone: c?.agentPhone ?? "",
      agentEmail: c?.agentEmail ?? "",
      managerName: c?.managerName ?? "",
      managerCompany: c?.managerCompany ?? "",
      managerPhone: c?.managerPhone ?? "",
      managerEmail: c?.managerEmail ?? "",
      hospitalityRider: c?.hospitalityRider ?? "",
      technicalRider: c?.technicalRider ?? "",
      dressingRoomRequirements: c?.dressingRoomRequirements ?? "",
      accessibilityRequirements: c?.accessibilityRequirements ?? "",
      socialInstagram: c?.socialInstagram ?? "",
      socialTwitter: c?.socialTwitter ?? "",
      socialTikTok: c?.socialTikTok ?? "",
      socialOther: c?.socialOther ?? "",
      notes: c?.notes ?? "",
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
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Stage name" error={errors.stageName?.message ?? fe.stageName?.[0]}>
            <Input {...register("stageName")} required />
          </Field>
          <Field label="Legal name"><Input {...register("legalName")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Phone"><Input {...register("phone")} /></Field>
          <Field label="Email"><Input type="email" {...register("email")} /></Field>
          <Field label="Address line 1"><Input {...register("addressLine1")} /></Field>
          <Field label="Address line 2"><Input {...register("addressLine2")} /></Field>
          <Field label="City"><Input {...register("city")} /></Field>
          <Field label="Postcode"><Input {...register("postcode")} /></Field>
          <Field label="Country"><Input {...register("country")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Agent</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><Input {...register("agentName")} /></Field>
          <Field label="Company"><Input {...register("agentCompany")} /></Field>
          <Field label="Phone"><Input {...register("agentPhone")} /></Field>
          <Field label="Email"><Input type="email" {...register("agentEmail")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Manager</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><Input {...register("managerName")} /></Field>
          <Field label="Company"><Input {...register("managerCompany")} /></Field>
          <Field label="Phone"><Input {...register("managerPhone")} /></Field>
          <Field label="Email"><Input type="email" {...register("managerEmail")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riders</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Hospitality rider"><Textarea {...register("hospitalityRider")} rows={5} /></Field>
          <Field label="Technical rider"><Textarea {...register("technicalRider")} rows={5} /></Field>
          <Field label="Dressing room requirements"><Textarea {...register("dressingRoomRequirements")} rows={3} /></Field>
          <Field label="Accessibility requirements"><Textarea {...register("accessibilityRequirements")} rows={3} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Social media</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Instagram"><Input {...register("socialInstagram")} /></Field>
          <Field label="Twitter / X"><Input {...register("socialTwitter")} /></Field>
          <Field label="TikTok"><Input {...register("socialTikTok")} /></Field>
          <Field label="Other"><Input {...register("socialOther")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <Field label="General notes"><Textarea {...register("notes")} rows={4} /></Field>
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
