import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { isoToDbDate, todayInTallinn } from "@/lib/dates";
import type { Turnover } from "@/lib/invoice";

// Turnover excluding VAT per company, by invoice date: the current calendar
// year (in Tallinn) and all time.
export async function GET() {
  const year = Number(todayInTallinn().slice(0, 4));
  try {
    const [companies, allTime, thisYear] = await Promise.all([
      prisma.company.findMany({ orderBy: { code: "asc" } }),
      prisma.invoice.groupBy({ by: ["companyId"], _sum: { amountNet: true }, _count: true }),
      prisma.invoice.groupBy({
        by: ["companyId"],
        where: {
          invoiceDate: { gte: isoToDbDate(`${year}-01-01`), lt: isoToDbDate(`${year + 1}-01-01`) },
        },
        _sum: { amountNet: true },
        _count: true,
      }),
    ]);

    const result: Turnover = {
      year,
      companies: companies.map((c) => {
        const all = allTime.find((r) => r.companyId === c.id);
        const current = thisYear.find((r) => r.companyId === c.id);
        return {
          companyId: c.id,
          companyName: c.name,
          invoicePrefix: c.invoicePrefix,
          currentYear: current?._sum.amountNet?.toFixed(2) ?? "0.00",
          currentYearCount: current?._count ?? 0,
          allTime: all?._sum.amountNet?.toFixed(2) ?? "0.00",
          allTimeCount: all?._count ?? 0,
        };
      }),
    };
    return Response.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
