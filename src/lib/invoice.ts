// Invoice shapes and validation, shared by the client form and the API.
import { isValidIsoDate } from "@/lib/dates";
import { parseAmountToCents } from "@/lib/money";
import type { FieldErrors } from "@/lib/customer";

export const DEFAULT_DESCRIPTION = "Muusikaline esinemine";
export const DEFAULT_PAYMENT_DAYS = 14;
export const MAX_AMOUNT_CENTS = 100_000_000; // 1 000 000 €

export type Company = {
  id: number;
  code: string;
  name: string;
  vatRegistered: boolean;
  vatNumber: string | null;
  vatRate: string;
  invoicePrefix: string;
};

export type Invoice = {
  id: number;
  number: string;
  companyId: number;
  companyName: string;
  customerId: number;
  customerName: string;
  performanceDate: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  amountNet: string;
  vatRate: string;
  vatAmount: string;
  amountTotal: string;
  createdAt: string;
};

export type InvoiceInput = {
  companyId: number | null;
  customerId: number | null;
  performanceDate: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  amountNet: string;
};

export type InvoiceData = {
  companyId: number;
  customerId: number;
  performanceDate: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  netCents: number;
};

export function validateInvoice(input: unknown):
  | { ok: true; data: InvoiceData }
  | { ok: false; errors: FieldErrors<keyof InvoiceInput> } {
  const raw = (input ?? {}) as Record<string, unknown>;
  const errors: FieldErrors<keyof InvoiceInput> = {};

  const companyId = Number(raw.companyId);
  if (!Number.isInteger(companyId) || companyId <= 0) errors.companyId = "Vali ettevõte.";

  const customerId = Number(raw.customerId);
  if (!raw.customerId || !Number.isInteger(customerId) || customerId <= 0) {
    errors.customerId = "Vali klient.";
  }

  const dates = {
    performanceDate: "Sisesta esinemise kuupäev.",
    invoiceDate: "Sisesta arve kuupäev.",
    dueDate: "Sisesta maksetähtaeg.",
  } as const;
  for (const [key, message] of Object.entries(dates) as [keyof typeof dates, string][]) {
    if (!isValidIsoDate(raw[key])) errors[key] = message;
  }
  if (
    !errors.invoiceDate &&
    !errors.dueDate &&
    (raw.dueDate as string) < (raw.invoiceDate as string)
  ) {
    errors.dueDate = "Maksetähtaeg ei saa olla varasem kui arve kuupäev.";
  }

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (!description) errors.description = "Sisesta kirjeldus.";
  else if (description.length > 500) errors.description = "Kirjeldus on liiga pikk (kuni 500 märki).";

  const netCents = parseAmountToCents(String(raw.amountNet ?? ""));
  if (netCents === null) {
    errors.amountNet = "Sisesta summa eurodes, kuni kahe komakohaga (nt 250,00).";
  } else if (netCents <= 0) {
    errors.amountNet = "Summa peab olema suurem kui 0.";
  } else if (netCents > MAX_AMOUNT_CENTS) {
    errors.amountNet = "Summa on liiga suur.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      companyId,
      customerId,
      performanceDate: raw.performanceDate as string,
      invoiceDate: raw.invoiceDate as string,
      dueDate: raw.dueDate as string,
      description,
      netCents: netCents!,
    },
  };
}
