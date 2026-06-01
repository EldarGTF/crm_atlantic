/** Тип клиента: частное лицо, организация, госзаказ. */
export const CLIENT_STATUS_LABELS: Record<string, string> = {
  PRIVATE: "Частный клиент",
  LEGAL: "Юр.лицо",
  GOVERNMENT: "Гос.заказ",
};

export const CLIENT_STATUS_BADGE_VARIANT: Record<
  string,
  "secondary" | "default" | "destructive"
> = {
  PRIVATE: "secondary",
  LEGAL: "default",
  GOVERNMENT: "destructive",
};

/** Подпись типа клиента; fallback для старых значений в БД до миграции. */
export function clientStatusLabel(status: string): string {
  return CLIENT_STATUS_LABELS[status] ?? status;
}

export function clientStatusBadgeVariant(
  status: string,
): "secondary" | "default" | "destructive" {
  return CLIENT_STATUS_BADGE_VARIANT[status] ?? "secondary";
}

/** Температура лида: насколько клиент готов к покупке (не путать с типом клиента). */
export const CLIENT_TEMPERATURE_LABELS: Record<string, string> = {
  COLD: "Холодный",
  WARM: "Тёплый",
  HOT: "Горячий",
};

export const CLIENT_TEMPERATURE_HINTS: Record<string, string> = {
  COLD: "Только интересуется, срок не определён",
  WARM: "Сравнивает, нужен дожим",
  HOT: "Готов к замеру / заказу, срочно",
};

export const CLIENT_TEMPERATURE_CLASSES: Record<string, string> = {
  COLD: "bg-sky-50 text-sky-700 border-sky-200",
  WARM: "bg-amber-50 text-amber-700 border-amber-200",
  HOT: "bg-red-50 text-red-700 border-red-200",
};

export const CLIENT_LIST_SORTS = [
  "created_desc",
  "created_asc",
  "name_asc",
  "name_desc",
  "temperature_desc",
  "temperature_asc",
] as const;

export type ClientListSort = (typeof CLIENT_LIST_SORTS)[number];

export const CLIENT_LIST_SORT_LABELS: Record<ClientListSort, string> = {
  created_desc: "Сначала новые",
  created_asc: "Сначала старые",
  name_asc: "Имя А–Я",
  name_desc: "Имя Я–А",
  temperature_desc: "Сначала горячие",
  temperature_asc: "Сначала холодные",
};

export function clientsListHref(params: {
  q?: string;
  temperature?: string;
  sort?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.temperature) sp.set("temperature", params.temperature);
  if (params.sort && params.sort !== "created_desc") sp.set("sort", params.sort);
  const qs = sp.toString();
  return qs ? `/clients?${qs}` : "/clients";
}
