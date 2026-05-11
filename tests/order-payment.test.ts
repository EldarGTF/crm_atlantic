import { describe, expect, it } from "vitest";
import { calculatePaymentStatus } from "../lib/order-payment";

describe("calculatePaymentStatus", () => {
  it("returns UNPAID when paid is zero", () => {
    expect(calculatePaymentStatus(1000, 0)).toBe("UNPAID");
  });

  it("returns UNPAID when paid is negative", () => {
    expect(calculatePaymentStatus(1000, -100)).toBe("UNPAID");
  });

  it("returns PREPAID when paid is between zero and total", () => {
    expect(calculatePaymentStatus(1000, 400)).toBe("PREPAID");
  });

  it("returns PAID when paid equals total", () => {
    expect(calculatePaymentStatus(1000, 1000)).toBe("PAID");
  });

  it("returns PAID when paid exceeds total", () => {
    expect(calculatePaymentStatus(1000, 1200)).toBe("PAID");
  });
});
