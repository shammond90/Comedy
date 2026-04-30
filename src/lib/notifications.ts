import "server-only";
import { and, count, desc, eq, isNull, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications, type NotificationType } from "@/db/schema";

export async function notify(opts: {
  userId: string;
  orgId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<void> {
  await db.insert(notifications).values({
    userId: opts.userId,
    orgId: opts.orgId ?? null,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? null,
    link: opts.link ?? null,
  });
}

export async function notifyMany(
  userIds: string[],
  payload: Omit<Parameters<typeof notify>[0], "userId">,
): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await db.insert(notifications).values(
    unique.map((uid) => ({
      userId: uid,
      orgId: payload.orgId ?? null,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
    })),
  );
}

export async function listNotifications(
  userId: string,
  limit = 50,
): Promise<Array<typeof notifications.$inferSelect>> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function unreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(row?.n ?? 0);
}

export async function markRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        inArray(notifications.id, ids),
        isNull(notifications.readAt),
      ),
    );
}

export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
