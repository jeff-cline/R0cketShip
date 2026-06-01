export interface PaypalEnv {
  clientId: string;
  secret: string;
  base?: string;
}

function apiBase(env: PaypalEnv): string {
  return env.base ?? "https://api-m.sandbox.paypal.com";
}

export async function paypalToken(env: PaypalEnv): Promise<string> {
  const auth = Buffer.from(`${env.clientId}:${env.secret}`).toString("base64");
  const res = await fetch(`${apiBase(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${auth}` },
    body: "grant_type=client_credentials",
  });
  const json = await res.json();
  if (!json.access_token) throw new Error("paypal token failed");
  return json.access_token as string;
}

export async function createPaypalOrder(
  env: PaypalEnv,
  payment: { id: string; amountUsd: number },
  urls: { success: string; cancel: string },
): Promise<{ orderId: string; approveUrl: string }> {
  const token = await paypalToken(env);
  const res = await fetch(`${apiBase(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value: payment.amountUsd.toFixed(2) }, custom_id: payment.id }],
      application_context: { return_url: urls.success, cancel_url: urls.cancel },
    }),
  });
  const json = await res.json();
  const approve = (json.links ?? []).find((l: { rel: string; href: string }) => l.rel === "approve")?.href;
  if (!json.id || !approve) throw new Error("paypal order failed");
  return { orderId: json.id as string, approveUrl: approve };
}

export async function capturePaypalOrder(env: PaypalEnv, orderId: string): Promise<{ ok: boolean; paymentId: string | null }> {
  const token = await paypalToken(env);
  const res = await fetch(`${apiBase(env)}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  const ok = json.status === "COMPLETED";
  const pu = json.purchase_units?.[0];
  const paymentId = pu?.payments?.captures?.[0]?.custom_id ?? pu?.custom_id ?? null;
  return { ok, paymentId };
}
