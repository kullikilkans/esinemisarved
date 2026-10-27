"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/error-state";
import { fetchJson } from "@/lib/fetch-json";

type Company = { id: number; name: string; invoicePrefix: string; vatRegistered: boolean };

// Temporary content until the invoice form is built: confirms the database
// connection and seed by listing the companies.
export function NewInvoicePlaceholder() {
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchJson<Company[]>("/api/companies")
      .then(setCompanies)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const retry = () => {
    setError(null);
    setCompanies(null);
    load();
  };

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!companies) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ettevõtted</CardTitle>
        <CardDescription>Andmebaas töötab. Arve vorm lisandub järgmises osas.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {companies.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="font-medium">{c.name}</span>
            <span className="text-sm text-muted-foreground">
              {c.invoicePrefix} · {c.vatRegistered ? "KMKR" : "Mitte-KMKR"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
