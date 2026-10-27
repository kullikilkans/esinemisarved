"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  validateCustomer,
  type Customer,
  type CustomerInput,
  type FieldErrors,
} from "@/lib/customer";
import { ApiError, fetchJson } from "@/lib/fetch-json";

const EMPTY: CustomerInput = { name: "", regCode: "", address: "", email: "" };

const FIELDS: {
  key: keyof CustomerInput;
  label: string;
  type?: string;
  inputMode?: "numeric" | "email";
  autoComplete?: string;
}[] = [
  { key: "name", label: "Nimi *", autoComplete: "organization" },
  { key: "regCode", label: "Registrikood", inputMode: "numeric" },
  { key: "address", label: "Aadress", autoComplete: "street-address" },
  { key: "email", label: "E-post", type: "email", inputMode: "email", autoComplete: "email" },
];

function toInput(c: Customer | null): CustomerInput {
  if (!c) return EMPTY;
  return { name: c.name, regCode: c.regCode ?? "", address: c.address ?? "", email: c.email ?? "" };
}

// Add or edit a customer. Pass `customer` to edit; leave it null to add.
export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSaved: (customer: Customer) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent>
        {/* Keyed so the form resets each time the dialog opens */}
        {open && (
          <CustomerForm
            key={customer?.id ?? "new"}
            customer={customer}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({
  customer,
  onCancel,
  onSaved,
}: {
  customer: Customer | null;
  onCancel: () => void;
  onSaved: (customer: Customer) => void;
}) {
  const [values, setValues] = useState<CustomerInput>(() => toInput(customer));
  const [errors, setErrors] = useState<FieldErrors<keyof CustomerInput>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = customer !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // The dialog is portaled, but React events still bubble through the
    // component tree, so without this the invoice form would submit too
    e.stopPropagation();
    const result = validateCustomer(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const saved = await fetchJson<Customer>(
        isEdit ? `/api/customers/${customer.id}` : "/api/customers",
        { method: isEdit ? "PUT" : "POST", body: JSON.stringify(values) },
      );
      toast.success(isEdit ? "Kliendi andmed salvestatud" : "Klient lisatud");
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) {
        setErrors(err.fields);
      } else {
        toast.error((err as Error).message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Muuda klienti" : "Uus klient"}</DialogTitle>
        <DialogDescription>Tärniga väljad on kohustuslikud.</DialogDescription>
      </DialogHeader>
      {FIELDS.map(({ key, label, type, inputMode, autoComplete }) => (
        <div key={key} className="flex flex-col gap-2">
          <Label htmlFor={`customer-${key}`}>{label}</Label>
          <Input
            id={`customer-${key}`}
            type={type ?? "text"}
            inputMode={inputMode}
            autoComplete={autoComplete}
            value={values[key]}
            onChange={(e) => {
              setValues((v) => ({ ...v, [key]: e.target.value }));
              if (errors[key]) setErrors((errs) => ({ ...errs, [key]: undefined }));
            }}
            aria-invalid={errors[key] ? true : undefined}
            aria-describedby={errors[key] ? `customer-${key}-error` : undefined}
          />
          {errors[key] && (
            <p id={`customer-${key}-error`} className="text-sm text-destructive">
              {errors[key]}
            </p>
          )}
        </div>
      ))}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Loobu
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Salvesta
        </Button>
      </DialogFooter>
    </form>
  );
}
