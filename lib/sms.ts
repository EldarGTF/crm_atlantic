import { format } from "date-fns";
import { ru } from "date-fns/locale";

const API_KEY = process.env.MOBIZON_API_KEY;
const SENDER = process.env.MOBIZON_SENDER; // только если зарегистрировано в Mobizon
const API_DOMAIN = process.env.MOBIZON_DOMAIN ?? "api.mobizon.kz";
const BASE_URL = `https://${API_DOMAIN}/service/message/sendSMSMessage`;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return "7" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 11) return digits;
  return digits;
}

async function sendSms(phone: string, text: string): Promise<void> {
  if (!API_KEY) {
    console.warn("[SMS] MOBIZON_API_KEY not set, skipping");
    return;
  }
  const recipient = normalizePhone(phone);
  const params = new URLSearchParams({ apiKey: API_KEY, recipient, text });
  if (SENDER) params.set("from", SENDER);
  try {
    const res = await fetch(`${BASE_URL}?output=json&api=v1`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const json = await res.json();
    if (json?.code === 0) {
      console.log(`[SMS] Sent to ${recipient}, messageId: ${json?.data?.messageId}`);
    } else {
      console.error(`[SMS] Error sending to ${recipient}:`, json?.message, json?.code);
    }
  } catch (e) {
    console.error(`[SMS] Request failed for ${recipient}:`, e);
  }
}

export function formatDate(date: Date): string {
  return format(date, "d MMMM yyyy 'в' HH:mm", { locale: ru });
}

export async function sendMeasurementSms(phone: string, clientName: string, scheduledAt: Date, address: string, measurerName: string) {
  const text = `Здравствуйте, ${clientName}! Замер назначен на ${formatDate(scheduledAt)}. Адрес: ${address}. Замерщик: ${measurerName}. — Atlantic Окна`;
  await sendSms(phone, text).catch(() => {});
}

export async function sendInstallationSms(phone: string, clientName: string, scheduledAt: Date, address: string, installerName: string) {
  const text = `Здравствуйте, ${clientName}! Монтаж окон назначен на ${formatDate(scheduledAt)}. Адрес: ${address}. Мастер: ${installerName}. — Atlantic Окна`;
  await sendSms(phone, text).catch(() => {});
}

export async function sendRescheduleSms(phone: string, clientName: string, type: "замер" | "монтаж", scheduledAt: Date) {
  const text = `Здравствуйте, ${clientName}! Ваш ${type} перенесён на ${formatDate(scheduledAt)}. — Atlantic Окна`;
  await sendSms(phone, text).catch(() => {});
}
