// Client-side fetch helper: returns parsed JSON or throws an ApiError with the
// server's Estonian message (or a generic one if the server is unreachable).

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Serveriga ei õnnestunud ühendust luua. Kontrolli internetiühendust.", 0);
  }
  if (res.status === 401) {
    // Full page load on purpose, so the proxy handles the login redirect
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
    throw new ApiError("Palun logi sisse.", 401);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error ?? "Midagi läks valesti. Proovi uuesti.", res.status, body?.fields);
  }
  return body as T;
}
