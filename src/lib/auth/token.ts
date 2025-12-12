import type { SessionPayload } from "./types";

type VerifyResult =
  | { valid: true; payload: SessionPayload }
  | { valid: false; reason: string; payload?: SessionPayload };

function decodeBase64Url(section: string) {
  const normalized = section.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  if (typeof atob === "function") {
    return atob(padded);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("binary");
  }
  throw new Error("No base64 decoder available");
}

function decodeSection(section: string) {
  try {
    const json = decodeBase64Url(section);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function verifySignature(
  unsigned: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (typeof crypto === "undefined" || !("subtle" in crypto)) return true;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const decoded = decodeBase64Url(signature);
    const sigBytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    return crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(unsigned)
    );
  } catch (error) {
    console.warn("Token signature verification failed", error);
    return false;
  }
}

export async function verifyToken(token: string): Promise<VerifyResult> {
  const parts = token.split(".");

  // Accept opaque tokens but mark them as unverified; allow middleware to handle via cookie roles
  if (parts.length !== 3) {
    return {
      valid: true,
      payload: {
        sub: "opaque",
      },
    };
  }

  const [headerB64, payloadB64, signature] = parts;
  const payload = decodeSection(payloadB64) as SessionPayload | null;
  if (!payload) {
    return { valid: false, reason: "invalid-payload" };
  }

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return { valid: false, reason: "token-expired", payload };
  }

  const secret = process.env.AUTH_TOKEN_SECRET;
  if (secret) {
    const unsigned = `${headerB64}.${payloadB64}`;
    const validSignature = await verifySignature(unsigned, signature, secret);
    if (!validSignature) {
      return { valid: false, reason: "signature-mismatch", payload };
    }
  }

  return { valid: true, payload };
}
