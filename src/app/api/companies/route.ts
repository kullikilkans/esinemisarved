import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({ orderBy: { code: "asc" } });
    return Response.json(companies);
  } catch (err) {
    return handleApiError(err);
  }
}
