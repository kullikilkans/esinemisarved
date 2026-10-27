import { redirectTo } from "@/lib/redirect";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const response = redirectTo(request, "/login");
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
