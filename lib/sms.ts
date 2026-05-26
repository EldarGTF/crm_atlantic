import { format } from "date-fns";
import { ru } from "date-fns/locale";

const API_KEY = process.env.MOBIZON_API_KEY;
const SENDER = process.env.MOBIZON_SENDER;
const API_DOMAIN = process.env.MOBIZON_DOMAIN ?? "api.mobizon.kz";
const BASE_URL = `https://${API_DOMAIN}/service/message/sendsmsmessage`;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return "7" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 11) return digits;
  return digits;
}

async function sendSms(phone: string, text: string): Promise<void> {
  if (!API_KEY) return;

  const recipient = normalizePhone(phone);
  const body = new URLSearchParams({ recipient, text, apiKey: API_KEY });
  if (SENDER) body.set("from", SENDER);

  try {
    const res = await fetch(`${BASE_URL}?output=json&api=v1`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const raw = await res.text();
    let json: { code?: number; message?: string };
    try {
      json = JSON.parse(raw) as { code?: number; message?: string };
    } catch {
      console.error("[SMS] Invalid JSON response");
      return;
    }
    if (json?.code !== 0) {
      console.error(`[SMS] Send failed: code=${json?.code} msg=${json?.message ?? "unknown"}`);
    }
  } catch (e) {
    console.error("[SMS] Request failed:", e instanceof Error ? e.message : e);
  }
}

export function formatDate(date: Date): string {
  return format(date, "d MMMM yyyy 'в' HH:mm", { locale: ru });
}

export async function sendMeasurementSms(phone: string, clientName: string, scheduledAt: Date, address: string, measurerName: string) {
  const text = [
    `Здравствуйте, ${clientName}!`,
    ``,
    `Замер назначен на ${formatDate(scheduledAt)}.`,
    `Адрес: ${address}`,
    `Замерщик: ${measurerName}`,
    ``,
    `Atlantic Company`,
  ].join("\n");
  await sendSms(phone, text).catch(() => {});
}

export async function sendInstallationSms(phone: string, clientName: string, scheduledAt: Date, address: string, installerName: string) {
  const text = [
    `Здравствуйте, ${clientName}!`,
    ``,
    `Монтаж назначен на ${formatDate(scheduledAt)}.`,
    `Адрес: ${address}`,
    `Мастер: ${installerName}`,
    ``,
    `Atlantic Company`,
  ].join("\n");
  await sendSms(phone, text).catch(() => {});
}

export async function sendRescheduleSms(phone: string, clientName: string, type: "замер" | "монтаж", scheduledAt: Date) {
  const text = [
    `Здравствуйте, ${clientName}!`,
    ``,
    `Дата ${type === "замер" ? "замера" : "монтажа"} перенесена на ${formatDate(scheduledAt)}.`,
    ``,
    `Atlantic Company`,
  ].join("\n");
  await sendSms(phone, text).catch(() => {});
}
