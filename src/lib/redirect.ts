import { NextResponse } from "next/server";

function firstValue(header: string | null): string | null {
  const value = header?.split(",")[0]?.trim();
  return value ? value : null;
}

// Absolute URL on the public host. Behind Render's proxy, request.url is the
// internal address (http://localhost:10000), so the public protocol and host
// come from the x-forwarded-* headers that Render sets.
export function publicUrl(request: Request, path: string): URL {
  const internal = new URL(request.url);
  const proto =
    firstValue(request.headers.get("x-forwarded-proto")) ?? internal.protocol.replace(":", "");
  const host =
    firstValue(request.headers.get("x-forwarded-host")) ??
    firstValue(request.headers.get("host")) ??
    internal.host;
  return new URL(path, `${proto}://${host}`);
}

export function redirectTo(request: Request, path: string, status = 303) {
  return NextResponse.redirect(publicUrl(request, path), status);
}
