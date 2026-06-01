import { format } from "date-fns";
import { formatOrderNumber } from "@/lib/order-number";

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

/** «06» января 2026 г. */
export function formatContractDateLong(date: Date): string {
  const day = format(date, "dd");
  const month = MONTHS_GENITIVE[date.getMonth()];
  const year = format(date, "yyyy");
  return `«${day}» ${month} ${year} г.`;
}

/** 06.01.2026 */
export function formatContractDateShort(date: Date): string {
  return format(date, "dd.MM.yyyy");
}

/** Номер договора = номер заказа (как в CRM: 1, 42…) */
export function formatContractNo(orderNumber: number): string {
  return String(orderNumber);
}

export function formatContractFileName(orderNumber: number): string {
  return `Договор подряда ${formatOrderNumber(orderNumber)}.docx`;
}

/** 10 000 — для ячеек таблицы */
export function formatMoneyDisplay(value: string | number): string {
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, "").replace(",", "."));
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);
}

export function calcWorkSum(qty: string, unitPrice: string): string {
  const q = Number(String(qty).replace(/\s/g, "").replace(",", "."));
  const p = Number(String(unitPrice).replace(/\s/g, "").replace(",", "."));
  if (Number.isNaN(q) || Number.isNaN(p)) return "";
  return formatMoneyDisplay(q * p);
}
