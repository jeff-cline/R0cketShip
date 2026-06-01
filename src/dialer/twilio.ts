import { getIntegrations } from "../integrations/store";

export interface TwilioConfig { sid: string; token: string; from: string }

export async function resolveTwilio(tenantId: string): Promise<TwilioConfig | null> {
  const i = await getIntegrations(tenantId);
  if (!i.twilioAccountSid || !i.twilioAuthToken || !i.twilioFromNumber) return null;
  return { sid: i.twilioAccountSid, token: i.twilioAuthToken, from: i.twilioFromNumber };
}

/** Click-to-call: Twilio calls the agent, then bridges to the lead. */
export async function placeClickToCall(
  cfg: TwilioConfig | null,
  opts: { agentNumber: string; leadNumber: string },
): Promise<{ status: "placed" | "skipped" | "failed"; sid?: string }> {
  if (!cfg) return { status: "skipped" };
  try {
    const twiml = `<Response><Dial>${opts.leadNumber}</Dial></Response>`;
    const body = new URLSearchParams({ To: opts.agentNumber, From: cfg.from, Twiml: twiml });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.sid}/Calls.json`, {
      method: "POST",
      headers: {
        authorization: "Basic " + Buffer.from(`${cfg.sid}:${cfg.token}`).toString("base64"),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const json = await res.json();
    if (json.sid) return { status: "placed", sid: json.sid };
    return { status: "failed" };
  } catch {
    return { status: "failed" };
  }
}
