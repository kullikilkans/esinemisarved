import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api";
import { dbDateToIso } from "@/lib/dates";
import { buildInvoicePdf } from "@/lib/pdf";

// Builds the PDF on the fly from the invoice's stored snapshot. Nothing is
// written to disk. ?inline=1 opens it in the browser instead of downloading.
export async function GET(request: Request, ctx: RouteContext<"/api/invoices/[id]/pdf">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError("Arvet ei leitud.", 404);

  try {
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) return jsonError("Arvet ei leitud.", 404);

    const pdf = await buildInvoicePdf({
      number: inv.number,
      invoiceDate: dbDateToIso(inv.invoiceDate),
      dueDate: dbDateToIso(inv.dueDate),
      performanceDate: dbDateToIso(inv.performanceDate),
      description: inv.description,
      amountNet: inv.amountNet.toFixed(2),
      vatRate: inv.vatRate.toFixed(2),
      vatAmount: inv.vatAmount.toFixed(2),
      amountTotal: inv.amountTotal.toFixed(2),
      seller: {
        name: inv.sellerName,
        regCode: inv.sellerRegCode,
        vatNumber: inv.sellerVatNumber,
        address: inv.sellerAddress,
        iban: inv.sellerIban,
        bank: inv.sellerBank,
        email: inv.sellerEmail,
      },
      buyer: {
        name: inv.buyerName,
        regCode: inv.buyerRegCode,
        address: inv.buyerAddress,
        email: inv.buyerEmail,
      },
    });

    const inline = new URL(request.url).searchParams.get("inline") === "1";
    const filename = `Arve_${inv.number}.pdf`;
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
