import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn(async () => ({ url: "https://checkout.stripe/abc" }));
const constructEvent = vi.fn(() => ({ type: "checkout.session.completed", data: { object: { metadata: { paymentId: "pay_1" } } } }));
vi.mock("stripe", () => ({ default: vi.fn(() => ({ checkout: { sessions: { create } }, webhooks: { constructEvent } })) }));

import { startStripeTopup, confirmStripeEvent } from "@/src/billing/providers/stripe";

describe("stripe adapter", () => {
  beforeEach(() => { create.mockClear(); constructEvent.mockClear(); });
  it("startStripeTopup creates a checkout session (amount in cents + paymentId metadata) and returns the url", async () => {
    const url = await startStripeTopup("sk_test", { id: "pay_1", amountUsd: 20 }, { success: "https://s", cancel: "https://c" });
    expect(url).toBe("https://checkout.stripe/abc");
    const arg = create.mock.calls[0][0] as any;
    expect(arg.metadata.paymentId).toBe("pay_1");
    expect(arg.line_items[0].price_data.unit_amount).toBe(2000);
  });
  it("confirmStripeEvent returns paymentId on checkout.session.completed", () => {
    expect(confirmStripeEvent("sk", "wh", "body", "sig")).toEqual({ paymentId: "pay_1" });
  });
  it("confirmStripeEvent ignores other event types", () => {
    constructEvent.mockReturnValueOnce({ type: "payment_intent.created", data: { object: {} } } as any);
    expect(confirmStripeEvent("sk", "wh", "body", "sig")).toEqual({ paymentId: null });
  });
});
