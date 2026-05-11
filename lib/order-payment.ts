export type PaymentStatus = "UNPAID" | "PREPAID" | "PAID";

export function calculatePaymentStatus(total: number, paid: number): PaymentStatus {
  if (paid <= 0) return "UNPAID";
  if (paid >= total) return "PAID";
  return "PREPAID";
}
