import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(): Buffer {
  const hex = process.env.SECRETS_KEY;
  if (!hex || hex.length !== 64) throw new Error("SECRETS_KEY must be 32-byte hex (64 chars)");
  return Buffer.from(hex, "hex");
}

/** AES-256-GCM encrypt -> "v1:iv:tag:ct" (base64 parts). null/empty -> null. */
export function encryptSecret(plain: string | null | undefined): string | null {
  if (plain == null || plain === "") return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(enc: string | null | undefined): string | null {
  if (enc == null || enc === "") return null;
  const parts = enc.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("bad ciphertext");
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ct = Buffer.from(parts[3], "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export function maskSecret(plain: string | null): string {
  if (!plain) return "";
  return plain.length <= 4 ? "••••" : `••••${plain.slice(-4)}`;
}
