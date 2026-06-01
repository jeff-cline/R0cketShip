import { describe, it, expect, vi, afterEach } from "vitest";
import { createPaypalOrder, capturePaypalOrder } from "@/src/billing/providers/paypal";

afterEach(() => vi.unstubAllGlobals());
const env = { clientId: "cid", secret: "sec" };

function mockFetchSeq(responses: any[]) {
  let i = 0;
  vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => responses[i++] })));
}

describe("paypal adapter", () => {
  it("createPaypalOrder gets a token then creates an order and returns the approve link", async () => {
    mockFetchSeq([{ access_token: "T" }, { id: "ORDER1", links: [{ rel: "approve", href: "https://paypal/approve" }] }]);
    const r = await createPaypalOrder(env, { id: "pay_1", amountUsd: 20 }, { success: "https://s", cancel: "https://c" });
    expect(r).toEqual({ orderId: "ORDER1", approveUrl: "https://paypal/approve" });
  });
  it("capturePaypalOrder returns ok + the custom_id paymentId on COMPLETED", async () => {
    mockFetchSeq([{ access_token: "T" }, { status: "COMPLETED", purchase_units: [{ payments: { captures: [{ custom_id: "pay_1" }] } }] }]);
    expect(await capturePaypalOrder(env, "ORDER1")).toEqual({ ok: true, paymentId: "pay_1" });
  });
});
