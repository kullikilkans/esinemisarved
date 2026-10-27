import { Prisma } from "@prisma/client";

export const DB_UNAVAILABLE_MESSAGE =
  "Andmebaasiga ei õnnestunud ühendust luua. Proovi hetke pärast uuesti.";

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isConnectionError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    (err instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1001", "P1002", "P1008", "P1017", "P2024"].includes(err.code))
  );
}

// Turns any unexpected error into a friendly Estonian JSON response
export function handleApiError(err: unknown) {
  console.error(err);
  if (isConnectionError(err)) return jsonError(DB_UNAVAILABLE_MESSAGE, 503);
  return jsonError("Midagi läks valesti. Proovi uuesti.", 500);
}
