import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api";
import { validateCustomer } from "@/lib/customer";
import { customerInclude, toCustomerJson } from "@/lib/customer-server";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isNotFound(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";
}

export async function PUT(request: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Klienti ei leitud.", 404);

  const body = await request.json().catch(() => null);
  const result = validateCustomer(body);
  if (!result.ok) {
    return Response.json({ error: "Kontrolli kliendi andmeid.", fields: result.errors }, { status: 400 });
  }
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: result.data,
      include: customerInclude,
    });
    return Response.json(toCustomerJson(customer));
  } catch (err) {
    if (isNotFound(err)) return jsonError("Klienti ei leitud.", 404);
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const id = parseId((await ctx.params).id);
  if (!id) return jsonError("Klienti ei leitud.", 404);

  try {
    const invoiceCount = await prisma.invoice.count({ where: { customerId: id } });
    if (invoiceCount > 0) {
      return jsonError(
        `Klienti ei saa kustutada, sest tal on ${invoiceCount} ${invoiceCount === 1 ? "arve" : "arvet"}. Väljastatud arved peavad säilima.`,
        409,
      );
    }
    await prisma.customer.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    if (isNotFound(err)) return jsonError("Klienti ei leitud.", 404);
    // The foreign key blocks deletion if an invoice was created in the meantime
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return jsonError("Klienti ei saa kustutada, sest tal on arveid.", 409);
    }
    return handleApiError(err);
  }
}
