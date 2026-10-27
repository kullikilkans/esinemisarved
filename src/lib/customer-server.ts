import type { Customer as DbCustomer } from "@prisma/client";
import type { Customer } from "@/lib/customer";

export const customerInclude = { _count: { select: { invoices: true } } } as const;

export function toCustomerJson(c: DbCustomer & { _count: { invoices: number } }): Customer {
  return {
    id: c.id,
    name: c.name,
    regCode: c.regCode,
    address: c.address,
    email: c.email,
    createdAt: c.createdAt.toISOString(),
    invoiceCount: c._count.invoices,
  };
}
