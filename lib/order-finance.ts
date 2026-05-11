import { calculatePaymentStatus, type PaymentStatus } from "./order-payment";

export type OrderFinanceSummary = {
  paid: number;
  debt: number;
  paymentStatus: PaymentStatus;
};

export function summarizeOrderFinance(total: number, payments: number[]): OrderFinanceSummary {
  const paid = payments.reduce((sum, amount) => sum + amount, 0);
  const debt = total - paid;
  const paymentStatus = calculatePaymentStatus(total, paid);

  return {
    paid,
    debt,
    paymentStatus,
  };
}
