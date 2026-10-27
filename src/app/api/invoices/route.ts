import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { validateInvoice } from "@/lib/invoice";
import { InvoiceInputError, createInvoice, toInvoiceJson } from "@/lib/invoice-server";

export async function GET(request: Request) {
  const companyId = Number(new URL(request.url).searchParams.get("companyId"));
  try {
    const invoices = await prisma.invoice.findMany({
      where: Number.isInteger(companyId) && companyId > 0 ? { companyId } : undefined,
      orderBy: [{ invoiceDate: "desc" }, { id: "desc" }],
    });
    return Response.json(invoices.map(toInvoiceJson));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = validateInvoice(body);
  if (!result.ok) {
    return Response.json({ error: "Kontrolli arve andmeid.", fields: result.errors }, { status: 400 });
  }
  try {
    const invoice = await createInvoice(result.data);
    return Response.json(toInvoiceJson(invoice), { status: 201 });
  } catch (err) {
    if (err instanceof InvoiceInputError) {
      return Response.json({ error: err.message, fields: { [err.field]: err.message } }, { status: 400 });
    }
    return handleApiError(err);
  }
}
