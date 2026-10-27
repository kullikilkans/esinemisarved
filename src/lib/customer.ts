// Customer shape and validation, shared by the client forms and the API.

export type Customer = {
  id: number;
  name: string;
  regCode: string | null;
  address: string | null;
  email: string | null;
  createdAt: string;
  invoiceCount: number;
};

export type CustomerInput = {
  name: string;
  regCode: string;
  address: string;
  email: string;
};

export type CustomerData = {
  name: string;
  regCode: string | null;
  address: string | null;
  email: string | null;
};

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateCustomer(input: unknown):
  | { ok: true; data: CustomerData }
  | { ok: false; errors: FieldErrors<keyof CustomerInput> } {
  const raw = (input ?? {}) as Record<string, unknown>;
  const name = clean(raw.name, 200);
  const regCode = clean(raw.regCode, 50);
  const address = clean(raw.address, 300);
  const email = clean(raw.email, 200);

  const errors: FieldErrors<keyof CustomerInput> = {};
  if (!name) errors.name = "Sisesta kliendi nimi.";
  if (regCode && !/^[0-9A-Za-z-]+$/.test(regCode)) {
    errors.regCode = "Registrikood võib sisaldada ainult numbreid ja tähti.";
  }
  if (email && !EMAIL_RE.test(email)) errors.email = "Sisesta korrektne e-posti aadress.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: { name, regCode: regCode || null, address: address || null, email: email || null },
  };
}
