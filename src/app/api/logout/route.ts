import { relativeRedirect } from "@/lib/redirect";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = relativeRedirect("/login");
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  );
  return response;
}
