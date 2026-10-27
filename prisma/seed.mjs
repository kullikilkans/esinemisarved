// Loads the two companies and the sample customers from sample_data.json.
// Runs on every start (see package.json) but only inserts into empty tables.
// A failure is logged and does not stop the server from starting.
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const file = new URL("../sample_data.json", import.meta.url);
  const data = JSON.parse(await readFile(file, "utf8"));

  if ((await prisma.company.count()) === 0) {
    await prisma.company.createMany({
      data: data.companies.map((c) => ({
        code: c.code,
        name: c.name,
        regCode: c.regCode,
        vatRegistered: c.vatRegistered,
        vatNumber: c.vatNumber ?? null,
        vatRate: c.vatRate,
        address: c.address,
        iban: c.iban,
        bank: c.bank,
        email: c.email,
        invoicePrefix: c.invoicePrefix,
        nextInvoiceNo: c.nextInvoiceNo ?? 1,
      })),
    });
    console.log(`Seed: added ${data.companies.length} companies`);
  } else {
    console.log("Seed: companies already exist, skipping");
  }

  if ((await prisma.customer.count()) === 0) {
    await prisma.customer.createMany({
      data: data.customers.map((c) => ({
        name: c.name,
        regCode: c.regCode ?? null,
        address: c.address ?? null,
        email: c.email ?? null,
      })),
    });
    console.log(`Seed: added ${data.customers.length} customers`);
  } else {
    console.log("Seed: customers already exist, skipping");
  }
}

main()
  .catch((err) => {
    console.error("Seed failed (server will still start):", err);
  })
  .finally(() => prisma.$disconnect());
