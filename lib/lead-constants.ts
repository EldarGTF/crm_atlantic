export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  MEASUREMENT_SCHEDULED: "Замер назначен",
  MEASUREMENT_DONE: "Замер выполнен",
  QUOTE_SENT: "КП отправлено",
  AGREED: "Согласовано",
  SENT_TO_PRODUCTION: "На производстве",
  IN_PRODUCTION: "В производстве",
  READY_FOR_INSTALLATION: "Готово к монтажу",
  INSTALLATION_SCHEDULED: "Монтаж назначен",
  INSTALLED: "Смонтировано",
  ACT_SIGNED: "Акт подписан",
  CLOSED: "Закрыта",
  CANCELLED: "Отказ",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "secondary",
  IN_PROGRESS: "default",
  MEASUREMENT_SCHEDULED: "default",
  MEASUREMENT_DONE: "default",
  QUOTE_SENT: "default",
  AGREED: "default",
  SENT_TO_PRODUCTION: "default",
  IN_PRODUCTION: "default",
  READY_FOR_INSTALLATION: "default",
  INSTALLATION_SCHEDULED: "default",
  INSTALLED: "default",
  ACT_SIGNED: "default",
  CLOSED: "secondary",
  CANCELLED: "destructive",
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  CALL: "Звонок",
  WEBSITE: "Сайт",
  INSTAGRAM: "Instagram",
  REFERRAL: "Рекомендация",
  REPEAT: "Повторный",
  OTHER: "Другое",
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_LABELS);
export const LEAD_SOURCES = Object.keys(LEAD_SOURCE_LABELS);
