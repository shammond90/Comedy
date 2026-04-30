"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from "@/lib/notifications";

export async function fetchNotificationsAction(): Promise<{
  rows: Array<{
    id: string;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    readAt: Date | null;
    createdAt: Date;
  }>;
  unread: number;
}> {
  const user = await requireUser();
  const [rows, unread] = await Promise.all([
    listNotifications(user.id, 30),
    unreadCount(user.id),
  ]);
  return {
    rows: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      link: r.link,
      readAt: r.readAt,
      createdAt: r.createdAt,
    })),
    unread,
  };
}

export async function markReadAction(ids: string[]): Promise<void> {
  const user = await requireUser();
  await markRead(user.id, ids);
  revalidatePath("/notifications");
}

export async function markAllReadAction(): Promise<void> {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath("/notifications");
}
