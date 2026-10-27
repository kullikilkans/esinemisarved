import { NextResponse } from "next/server";
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

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=config", request.url), 303);
  }
  if (!(await isCorrectPassword(password))) {
    return NextResponse.redirect(new URL("/login?error=wrong", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
