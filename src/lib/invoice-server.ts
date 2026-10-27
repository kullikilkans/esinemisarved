import { Prisma, type Invoice as DbInvoice } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dbDateToIso, isoToDbDate } from "@/lib/dates";
import { calculateVat, centsToDecimalString, rateToBasisPoints } from "@/lib/money";
import type { Invoice, InvoiceData } from "@/lib/invoice";

export function formatInvoiceNumber(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function toInvoiceJson(inv: DbInvoice): Invoice {
  return {
    id: inv.id,
    number: inv.number,
    companyId: inv.companyId,
    companyName: inv.sellerName,
    customerId: inv.customerId,
    customerName: inv.buyerName,
    performanceDate: dbDateToIso(inv.performanceDate),
    invoiceDate: dbDateToIso(inv.invoiceDate),
    dueDate: dbDateToIso(inv.dueDate),
    description: inv.description,
    amountNet: inv.amountNet.toFixed(2),
    vatRate: inv.vatRate.toFixed(2),
    vatAmount: inv.vatAmount.toFixed(2),
    amountTotal: inv.amountTotal.toFixed(2),
    createdAt: inv.createdAt.toISOString(),
  };
}

export class InvoiceInputError extends Error {
  constructor(public field: "companyId" | "customerId", message: string) {
    super(message);
  }
}

// Creates the invoice and takes the next number from the company's sequence
// in one transaction. The UPDATE ... increment locks the company row, so two
// simultaneous invoices for the same company wait for each other and never
// get the same number. If anything fails, the number is not used up.
export async function createInvoice(data: InvoiceData): Promise<DbInvoice> {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new InvoiceInputError("customerId", "Valitud klienti ei leitud.");

    let company;
    try {
      company = await tx.company.update({
        where: { id: data.companyId },
        data: { nextInvoiceNo: { increment: 1 } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new InvoiceInputError("companyId", "Valitud ettevõtet ei leitud.");
      }
      throw err;
    }

    const number = formatInvoiceNumber(company.invoicePrefix, company.nextInvoiceNo - 1);
    const vatRate = company.vatRegistered ? company.vatRate : new Prisma.Decimal(0);
    const { vatCents, totalCents } = calculateVat(data.netCents, rateToBasisPoints(vatRate.toString()));

    return tx.invoice.create({
      data: {
        number,
        companyId: company.id,
        customerId: customer.id,
        performanceDate: isoToDbDate(data.performanceDate),
        invoiceDate: isoToDbDate(data.invoiceDate),
        dueDate: isoToDbDate(data.dueDate),
        description: data.description,
        amountNet: centsToDecimalString(data.netCents),
        vatRate,
        vatAmount: centsToDecimalString(vatCents),
        amountTotal: centsToDecimalString(totalCents),
        sellerName: company.name,
        sellerRegCode: company.regCode,
        sellerVatNumber: company.vatRegistered ? company.vatNumber : null,
        sellerAddress: company.address,
        sellerIban: company.iban,
        sellerBank: company.bank,
        sellerEmail: company.email,
        buyerName: customer.name,
        buyerRegCode: customer.regCode,
        buyerAddress: customer.address,
        buyerEmail: customer.email,
      },
    });
  });
}
