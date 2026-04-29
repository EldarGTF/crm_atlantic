"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Status = "loading" | "subscribed" | "unsubscribed" | "unsupported";

export function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setStatus("unsupported"));
  }, []);

  async function toggle() {
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (status === "subscribed") {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setStatus("unsubscribed");
      } else {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        setStatus("subscribed");
      }
    } catch (e) {
      console.error("Push subscription error:", e);
    }
    setPending(false);
  }

  if (status === "unsupported" || status === "loading") return null;

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all w-full"
    >
      {status === "subscribed" ? (
        <BellOff className="h-4 w-4 shrink-0 text-slate-400" />
      ) : (
        <Bell className="h-4 w-4 shrink-0 text-slate-400" />
      )}
      {pending ? "Загрузка..." : status === "subscribed" ? "Откл. уведомления" : "Уведомления"}
    </button>
  );
}
