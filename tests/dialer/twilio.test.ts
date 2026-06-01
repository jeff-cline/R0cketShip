import { describe, it, expect, vi, afterEach } from "vitest";
import { placeClickToCall } from "@/src/dialer/twilio";

afterEach(() => vi.unstubAllGlobals());

describe("twilio click-to-call", () => {
  it("posts to Twilio with the agent as To and a Dial(lead) TwiML; returns the sid", async () => {
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: any) => { calls.push({ url, init }); return { json: async () => ({ sid: "CA123" }) }; }));
    const r = await placeClickToCall({ sid: "AC1", token: "tok", from: "+1999" }, { agentNumber: "+1555", leadNumber: "+1800" });
    expect(r).toEqual({ status: "placed", sid: "CA123" });
    expect(calls[0].url).toContain("/Accounts/AC1/Calls.json");
    const body = String(calls[0].init.body);
    expect(body).toContain("To=%2B1555");
    expect(decodeURIComponent(body)).toContain("<Dial>+1800</Dial>");
  });
  it("returns skipped when not configured", async () => {
    expect(await placeClickToCall(null, { agentNumber: "+1", leadNumber: "+2" })).toEqual({ status: "skipped" });
  });
});
