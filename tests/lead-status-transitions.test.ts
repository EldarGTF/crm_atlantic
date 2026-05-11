import { describe, expect, it } from "vitest";
import {
  canSendToProduction,
  nextStatusOnDeptDone,
  nextStatusOnDeptTaken,
} from "../lib/lead-status-transitions";

describe("lead status transitions", () => {
  it("allows sending to production from sales statuses", () => {
    expect(canSendToProduction("AGREED")).toBe(true);
    expect(canSendToProduction("QUOTE_SENT")).toBe(true);
  });

  it("blocks sending to production from production and final statuses", () => {
    expect(canSendToProduction("SENT_TO_PRODUCTION")).toBe(false);
    expect(canSendToProduction("IN_PRODUCTION")).toBe(false);
    expect(canSendToProduction("READY_FOR_INSTALLATION")).toBe(false);
    expect(canSendToProduction("INSTALLED")).toBe(false);
    expect(canSendToProduction("CLOSED")).toBe(false);
  });

  it("moves SENT_TO_PRODUCTION to IN_PRODUCTION when dept is taken", () => {
    expect(nextStatusOnDeptTaken("SENT_TO_PRODUCTION")).toBe("IN_PRODUCTION");
  });

  it("keeps status unchanged when taking dept from other statuses", () => {
    expect(nextStatusOnDeptTaken("IN_PRODUCTION")).toBe("IN_PRODUCTION");
    expect(nextStatusOnDeptTaken("READY_FOR_INSTALLATION")).toBe("READY_FOR_INSTALLATION");
  });

  it("moves to READY_FOR_INSTALLATION when all depts are done", () => {
    expect(nextStatusOnDeptDone("IN_PRODUCTION", true)).toBe("READY_FOR_INSTALLATION");
  });

  it("keeps IN_PRODUCTION when not all depts are done", () => {
    expect(nextStatusOnDeptDone("SENT_TO_PRODUCTION", false)).toBe("IN_PRODUCTION");
    expect(nextStatusOnDeptDone("IN_PRODUCTION", false)).toBe("IN_PRODUCTION");
  });
});
