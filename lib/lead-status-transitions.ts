export const PRODUCTION_FLOW_STATUSES = new Set([
  "SENT_TO_PRODUCTION",
  "IN_PRODUCTION",
  "READY_FOR_INSTALLATION",
  "INSTALLATION_SCHEDULED",
  "INSTALLED",
  "ACT_SIGNED",
  "CLOSED",
  "CANCELLED",
]);

export function canSendToProduction(status: string) {
  return !PRODUCTION_FLOW_STATUSES.has(status);
}

export function nextStatusOnDeptTaken(currentStatus: string) {
  if (currentStatus === "SENT_TO_PRODUCTION") return "IN_PRODUCTION";
  return currentStatus;
}

export function nextStatusOnDeptDone(currentStatus: string, allDeptsDone: boolean) {
  if (allDeptsDone) return "READY_FOR_INSTALLATION";
  if (currentStatus === "SENT_TO_PRODUCTION" || currentStatus === "IN_PRODUCTION") {
    return "IN_PRODUCTION";
  }
  return currentStatus;
}
