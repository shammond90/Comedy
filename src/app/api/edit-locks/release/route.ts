/**
 * Beacon endpoint for releasing an edit lock on tab close.
 *
 * Called via `navigator.sendBeacon('/api/edit-locks/release', body)` from
 * EditLockGuard's `beforeunload` handler. sendBeacon can't use server actions,
 * hence this thin POST handler.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { releaseLock } from "@/lib/edit-lock";
import { lockResourceTypeEnum } from "@/db/schema";

const bodySchema = z.object({
  resourceType: z.enum(lockResourceTypeEnum.enumValues),
  resourceId: z.string().uuid(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await releaseLock({
    resourceType: parsed.data.resourceType,
    resourceId: parsed.data.resourceId,
    userId: user.id,
  });
  return NextResponse.json({ ok: true });
}
