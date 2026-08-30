function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toHex(bytes.buffer as ArrayBuffer);
}

export async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

async function getSigningKey() {
  const secret = process.env.SESSION_SECRET ?? "";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export type Role = "admin" | "staff";

export async function createSessionCookie(username: string, role: Role) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const payload = `${username}.${role}.${exp}`;
  const key = await getSigningKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${base64UrlEncode(sig)}`;
}

export async function verifySessionCookie(
  value: string | undefined
): Promise<{ username: string; role: Role } | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [username, role, expStr, sigB64] = parts;
  const exp = parseInt(expStr, 10);
  if (!exp || Date.now() / 1000 > exp) return null;
  if (role !== "admin" && role !== "staff") return null;

  const key = await getSigningKey();
  const payload = `${username}.${role}.${expStr}`;
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(sigB64),
    new TextEncoder().encode(payload)
  );
  return valid ? { username, role } : null;
}
