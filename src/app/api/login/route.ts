import { relativeRedirect } from "@/lib/redirect";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  expectedSessionToken,
  isCorrectPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const token = await expectedSessionToken();

  if (!token) return relativeRedirect("/login?error=config");
  if (!(await isCorrectPassword(password))) return relativeRedirect("/login?error=wrong");

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const response = relativeRedirect("/");
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`,
  );
  return response;
}
