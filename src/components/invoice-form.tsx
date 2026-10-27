"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, ExternalLink, FilePlus2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { CustomerDialog } from "@/components/customer-dialog";
import type { Customer, FieldErrors } from "@/lib/customer";
import { addDays, formatDate, todayInTallinn } from "@/lib/dates";
import { ApiError, fetchJson } from "@/lib/fetch-json";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_PAYMENT_DAYS,
  validateInvoice,
  type Company,
  type Invoice,
  type InvoiceInput,
} from "@/lib/invoice";
import { calculateVat, formatEur, formatRate, parseAmountToCents, rateToBasisPoints } from "@/lib/money";
import { cn } from "@/lib/utils";

type Errors = FieldErrors<keyof InvoiceInput>;

function initialValues(companyId: number | null): InvoiceInput {
  const today = todayInTallinn();
  return {
    companyId,
    customerId: null,
    performanceDate: today,
    invoiceDate: today,
    dueDate: addDays(today, DEFAULT_PAYMENT_DAYS),
    description: DEFAULT_DESCRIPTION,
    amountNet: "",
  };
}

function pdfUrl(id: number, inline = false) {
  return `/api/invoices/${id}/pdf${inline ? "?inline=1" : ""}`;
}

// Desktop browsers download reliably after an async save; phones get buttons
function isDesktop() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function startDownload(id: number) {
  const a = document.createElement("a");
  a.href = pdfUrl(id);
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function matchesCustomer(c: Customer, query: string) {
  const q = query.trim().toLocaleLowerCase("et");
  if (!q) return true;
  return [c.name, c.regCode].some((v) => v?.toLocaleLowerCase("et").includes(q));
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function InvoiceForm({
  companies,
  initialCustomers,
}: {
  companies: Company[];
  initialCustomers: Customer[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [values, setValues] = useState<InvoiceInput>(() => initialValues(companies[0]?.id ?? null));
  const [dueTouched, setDueTouched] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Invoice | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  const company = companies.find((c) => c.id === values.companyId) ?? null;
  const customer = customers.find((c) => c.id === values.customerId) ?? null;

  const preview = useMemo(() => {
    const netCents = parseAmountToCents(values.amountNet);
    if (!company || netCents === null) return null;
    const rate = company.vatRegistered ? company.vatRate : "0";
    return { netCents, rate, ...calculateVat(netCents, rateToBasisPoints(rate)) };
  }, [company, values.amountNet]);

  function set<K extends keyof InvoiceInput>(key: K, value: InvoiceInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function setInvoiceDate(value: string) {
    setValues((v) => ({
      ...v,
      invoiceDate: value,
      // Keep due date at invoice date + 14 days until the user changes it
      dueDate: !dueTouched && value ? addDays(value, DEFAULT_PAYMENT_DAYS) : v.dueDate,
    }));
    setErrors((e) => ({ ...e, invoiceDate: undefined, dueDate: undefined }));
  }

  function handleCustomerCreated(saved: Customer) {
    setCustomers((list) => [...list, saved].sort((a, b) => a.name.localeCompare(b.name, "et")));
    set("customerId", saved.id);
    setCustomerDialogOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateInvoice(values);
    if (!result.ok) {
      setErrors(result.errors);
      toast.error("Kontrolli arve andmeid.");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const invoice = await fetchJson<Invoice>("/api/invoices", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setCreated(invoice);
      toast.success(`Arve ${invoice.number} koostatud`);
      if (isDesktop()) startDownload(invoice.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) setErrors(err.fields);
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function startNew() {
    setCreated(null);
    setValues(initialValues(values.companyId));
    setDueTouched(false);
    setErrors({});
  }

  if (created) return <InvoiceCreated invoice={created} onNew={startNew} />;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Arve väljastaja</CardTitle>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label="Arve väljastaja" className="grid gap-2 sm:grid-cols-2">
              {companies.map((c) => {
                const selected = c.id === values.companyId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("companyId", c.id)}
                    className={cn(
                      "flex min-h-16 flex-col items-start gap-1 rounded-lg border bg-background px-4 py-3 text-left transition-colors",
                      selected ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted",
                    )}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        c.vatRegistered ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {c.vatRegistered
                        ? `Käibemaksukohustuslane · KM ${formatRate(c.vatRate)}`
                        : "Ei ole käibemaksukohustuslane"}
                    </span>
                  </button>
                );
              })}
            </div>
            <FieldError id="companyId-error" message={errors.companyId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Klient</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="customer">Klient *</Label>
            <div className="flex gap-2">
              <Combobox
                items={customers}
                value={customer}
                onValueChange={(c: Customer | null) => set("customerId", c?.id ?? null)}
                itemToStringLabel={(c: Customer) => c.name}
                isItemEqualToValue={(a: Customer, b: Customer) => a.id === b.id}
                filter={matchesCustomer}
              >
                <ComboboxInput
                  id="customer"
                  placeholder="Otsi nime või registrikoodi järgi"
                  className="flex-1"
                  aria-invalid={errors.customerId ? true : undefined}
                  aria-describedby={errors.customerId ? "customerId-error" : undefined}
                />
                <ComboboxContent>
                  <ComboboxEmpty>Klienti ei leitud.</ComboboxEmpty>
                  <ComboboxList>
                    {(c: Customer) => (
                      <ComboboxItem key={c.id} value={c}>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">{c.name}</span>
                          {c.regCode && (
                            <span className="text-xs text-muted-foreground">{c.regCode}</span>
                          )}
                        </div>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(true)}>
                <Plus />
                Uus klient
              </Button>
            </div>
            <FieldError id="customerId-error" message={errors.customerId} />
            {customer && (customer.address || customer.regCode) && (
              <p className="text-sm text-muted-foreground">
                {[customer.regCode && `Reg. kood ${customer.regCode}`, customer.address]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kuupäevad</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <DateField
              id="performanceDate"
              label="Esinemise kuupäev"
              value={values.performanceDate}
              onChange={(v) => set("performanceDate", v)}
              error={errors.performanceDate}
            />
            <DateField
              id="invoiceDate"
              label="Arve kuupäev"
              value={values.invoiceDate}
              onChange={setInvoiceDate}
              error={errors.invoiceDate}
            />
            <DateField
              id="dueDate"
              label="Maksetähtaeg"
              value={values.dueDate}
              min={values.invoiceDate}
              onChange={(v) => {
                setDueTouched(true);
                set("dueDate", v);
              }}
              error={errors.dueDate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Esinemine ja tasu</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Kirjeldus *</Label>
              <Input
                id="description"
                value={values.description}
                maxLength={500}
                onChange={(e) => set("description", e.target.value)}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              <FieldError id="description-error" message={errors.description} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amountNet">Tasu käibemaksuta (EUR) *</Label>
              <div className="relative">
                <Input
                  id="amountNet"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  value={values.amountNet}
                  onChange={(e) => set("amountNet", e.target.value)}
                  onBlur={() => {
                    const cents = parseAmountToCents(values.amountNet);
                    if (cents !== null) set("amountNet", (cents / 100).toFixed(2).replace(".", ","));
                  }}
                  className="pr-10 text-right text-lg tabular-nums"
                  aria-invalid={errors.amountNet ? true : undefined}
                  aria-describedby={errors.amountNet ? "amountNet-error" : undefined}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
              </div>
              <FieldError id="amountNet-error" message={errors.amountNet} />
            </div>

            <dl className="flex flex-col gap-2 rounded-lg bg-muted px-4 py-3 text-sm" aria-live="polite">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Summa käibemaksuta</dt>
                <dd className="tabular-nums">{preview ? formatEur(preview.netCents, "cents") : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Käibemaks {company ? formatRate(company.vatRegistered ? company.vatRate : 0) : ""}
                </dt>
                <dd className="tabular-nums">{preview ? formatEur(preview.vatCents, "cents") : "—"}</dd>
              </div>
              {company && !company.vatRegistered && (
                <p className="text-xs text-muted-foreground">
                  Arve väljastaja ei ole käibemaksukohustuslane
                </p>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <dt>Tasuda kokku</dt>
                <dd className="text-primary tabular-nums">
                  {preview ? formatEur(preview.totalCents, "cents") : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
          Koosta arve
        </Button>
      </form>
      {/* Kept outside the <form> so its own submit never reaches this form */}
      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={null}
        onSaved={handleCustomerCreated}
      />
    </>
  );
}

function DateField({
  id,
  label,
  value,
  min,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function InvoiceCreated({ invoice, onNew }: { invoice: Invoice; onNew: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Arve koostatud</p>
          <p className="text-2xl font-semibold">{invoice.number}</p>
          <p className="text-muted-foreground">
            {invoice.customerName} · {formatDate(invoice.invoiceDate)}
          </p>
          <p className="text-xl font-semibold text-primary tabular-nums">{formatEur(invoice.amountTotal)}</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <a
            href={pdfUrl(invoice.id, true)}
            target="_blank"
            rel="noopener"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            <ExternalLink />
            Ava PDF
          </a>
          <a
            href={pdfUrl(invoice.id)}
            download={`Arve_${invoice.number}.pdf`}
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}
          >
            <Download />
            Laadi alla
          </a>
          <Button size="lg" variant="ghost" className="w-full" onClick={onNew}>
            <FilePlus2 />
            Uus arve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
