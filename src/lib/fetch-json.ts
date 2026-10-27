// Client-side fetch helper: returns parsed JSON or throws an Error with the
// server's Estonian message (or a generic one if the server is unreachable).
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Serveriga ei õnnestunud ühendust luua. Kontrolli internetiühendust.");
  }
  if (res.status === 401) {
    // Full page load on purpose, so the proxy handles the login redirect
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
    throw new Error("Palun logi sisse.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? "Midagi läks valesti. Proovi uuesti.");
  }
  return body as T;
}
