import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { validateCustomer } from "@/lib/customer";
import { customerInclude, toCustomerJson } from "@/lib/customer-server";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: customerInclude,
    });
    return Response.json(customers.map(toCustomerJson));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = validateCustomer(body);
  if (!result.ok) {
    return Response.json({ error: "Kontrolli kliendi andmeid.", fields: result.errors }, { status: 400 });
  }
  try {
    const customer = await prisma.customer.create({ data: result.data, include: customerInclude });
    return Response.json(toCustomerJson(customer), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
