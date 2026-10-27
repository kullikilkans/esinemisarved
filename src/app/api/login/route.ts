import { redirectTo } from "@/lib/redirect";
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

  if (!token) return redirectTo(request, "/login?error=config");
  if (!(await isCorrectPassword(password))) return redirectTo(request, "/login?error=wrong");

  const response = redirectTo(request, "/");
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
