// Shared-password login. The session cookie holds an HMAC of a fixed string
// keyed with APP_PASSWORD, so changing the password logs everyone out.

export const SESSION_COOKIE = "esinemisarved_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const SESSION_MESSAGE = "esinemisarved-session-v1";

async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function getAppPassword(): string | null {
  const pw = process.env.APP_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

export async function expectedSessionToken(): Promise<string | null> {
  const pw = getAppPassword();
  return pw ? hmacHex(pw, SESSION_MESSAGE) : null;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await expectedSessionToken();
  return expected !== null && timingSafeEqual(token, expected);
}

export async function isCorrectPassword(input: string): Promise<boolean> {
  const pw = getAppPassword();
  if (!pw) return false;
  // Compare HMACs so the comparison takes the same time regardless of input length
  const [a, b] = await Promise.all([
    hmacHex(SESSION_MESSAGE, input),
    hmacHex(SESSION_MESSAGE, pw),
  ]);
  return timingSafeEqual(a, b);
}
