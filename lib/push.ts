import "server-only";
import webpush from "web-push";
import { prisma } from "./prisma";

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "notify@example.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

type Payload = { title: string; body: string; url?: string };

export async function sendPushToUser(userId: string, payload: Payload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}

export async function sendPushToRole(role: string, payload: Payload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
  const users = await prisma.user.findMany({
    where: { active: true, role: role as never },
    select: { id: true },
  });
  await Promise.allSettled(users.map((u) => sendPushToUser(u.id, payload)));
}
