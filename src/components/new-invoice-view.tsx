"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { InvoiceForm } from "@/components/invoice-form";
import type { Customer } from "@/lib/customer";
import type { Company } from "@/lib/invoice";
import { fetchJson } from "@/lib/fetch-json";

// Loads companies and customers, then shows the form. The form mounts only
// in the browser after loading, so "today" is the user's actual date.
export function NewInvoiceView() {
  const [data, setData] = useState<{ companies: Company[]; customers: Customer[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([fetchJson<Company[]>("/api/companies"), fetchJson<Customer[]>("/api/customers")])
      .then(([companies, customers]) => setData({ companies, customers }))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const retry = () => {
    setError(null);
    load();
  };

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (data.companies.length === 0) {
    return <ErrorState message="Ettevõtteid ei leitud. Kontrolli, kas andmebaas on seemendatud." />;
  }
  return <InvoiceForm companies={data.companies} initialCustomers={data.customers} />;
}
