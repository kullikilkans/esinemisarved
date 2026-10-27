import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import type { Company } from "@/lib/invoice";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({ orderBy: { code: "asc" } });
    return Response.json(
      companies.map(
        (c): Company => ({
          id: c.id,
          code: c.code,
          name: c.name,
          vatRegistered: c.vatRegistered,
          vatNumber: c.vatNumber,
          vatRate: c.vatRate.toFixed(2),
          invoicePrefix: c.invoicePrefix,
        }),
      ),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
