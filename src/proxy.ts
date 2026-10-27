import { NextResponse, type NextRequest } from "next/server";
import { relativeRedirect } from "@/lib/redirect";
import { SESSION_COOKIE, getAppPassword, isValidSession } from "@/lib/auth";

// Everything except the login page, login/logout endpoints and static assets
// requires a valid session cookie.
export async function proxy(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (!getAppPassword()) {
    if (isApi) {
      return Response.json({ error: "Rakendus pole seadistatud." }, { status: 503 });
    }
    return relativeRedirect("/login?error=config", 307);
  }

  if (await isValidSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (isApi) {
    return Response.json({ error: "Palun logi sisse." }, { status: 401 });
  }
  return relativeRedirect("/login", 307);
}

export const config = {
  matcher: [
    "/((?!login|api/login|api/logout|_next/static|_next/image|favicon\\.ico|icon\\.svg|robots\\.txt).*)",
  ],
};
