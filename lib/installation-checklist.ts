export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  doneAt?: string;
};

export type InstallationChecklist = {
  items: ChecklistItem[];
};

export const DEFAULT_CHECKLIST_LABELS = [
  "Материалы доставлены на объект",
  "Монтаж рам выполнен",
  "Запенивание / стеклопакеты",
  "Фурнитура установлена",
  "Уборка после монтажа",
  "Акт / приёмка с клиентом",
];

export function createDefaultChecklist(): InstallationChecklist {
  return {
    items: DEFAULT_CHECKLIST_LABELS.map((label, i) => ({
      id: `item-${i}`,
      label,
      done: false,
    })),
  };
}

export function parseChecklist(raw: unknown): InstallationChecklist {
  if (!raw || typeof raw !== "object") return createDefaultChecklist();
  const o = raw as InstallationChecklist;
  if (!Array.isArray(o.items)) return createDefaultChecklist();
  return o;
}
