import { describe, expect, it } from "vitest";
import { summarizeOrderFinance } from "../lib/order-finance";

describe("summarizeOrderFinance", () => {
  it("calculates paid and debt for no payments", () => {
    const summary = summarizeOrderFinance(1000, []);
    expect(summary).toEqual({
      paid: 0,
      debt: 1000,
      paymentStatus: "UNPAID",
    });
  });

  it("returns PREPAID when order is partially paid", () => {
    const summary = summarizeOrderFinance(1000, [200, 300]);
    expect(summary).toEqual({
      paid: 500,
      debt: 500,
      paymentStatus: "PREPAID",
    });
  });

  it("returns PAID when order is fully paid", () => {
    const summary = summarizeOrderFinance(1000, [400, 600]);
    expect(summary).toEqual({
      paid: 1000,
      debt: 0,
      paymentStatus: "PAID",
    });
  });

  it("keeps negative debt for overpayment visibility", () => {
    const summary = summarizeOrderFinance(1000, [700, 500]);
    expect(summary).toEqual({
      paid: 1200,
      debt: -200,
      paymentStatus: "PAID",
    });
  });
});
