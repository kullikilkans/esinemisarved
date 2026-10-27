"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, FilePlus2, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/error-state";
import { formatDate } from "@/lib/dates";
import { fetchJson } from "@/lib/fetch-json";
import type { Company, Invoice, Turnover } from "@/lib/invoice";
import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";

type Data = { companies: Company[]; invoices: Invoice[]; turnover: Turnover };

function DownloadLink({ invoice }: { invoice: Invoice }) {
  return (
    <a
      href={`/api/invoices/${invoice.id}/pdf`}
      download={`Arve_${invoice.number}.pdf`}
      aria-label={`Laadi alla arve ${invoice.number}`}
      title="Laadi PDF alla"
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-primary")}
    >
      <Download />
    </a>
  );
}

export function InvoicesView() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    Promise.all([
      fetchJson<Company[]>("/api/companies"),
      fetchJson<Invoice[]>("/api/invoices"),
      fetchJson<Turnover>("/api/turnover"),
    ])
      .then(([companies, invoices, turnover]) => setData({ companies, invoices, turnover }))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const retry = () => {
    setError(null);
    load();
  };

  const invoices = useMemo(() => {
    if (!data) return [];
    // The API already returns newest first
    return filter === "all"
      ? data.invoices
      : data.invoices.filter((inv) => String(inv.companyId) === filter);
  }, [data, filter]);

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={filter} onValueChange={(v) => setFilter(String(v))}>
        <TabsList className="w-full">
          <TabsTrigger value="all">Kõik</TabsTrigger>
          {data.companies.map((c) => (
            <TabsTrigger key={c.id} value={String(c.id)} className="min-w-0">
              <span className="truncate">{c.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {data.invoices.length === 0 ? "Arveid pole veel koostatud." : "Selle ettevõtte arveid pole."}
          </p>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            <FilePlus2 />
            Koosta arve
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 rounded-lg border bg-card p-4 shadow-xs">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{inv.number}</span>
                    <span className="font-semibold tabular-nums">{formatEur(inv.amountTotal)}</span>
                  </div>
                  <div className="truncate text-sm">{inv.customerName}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(inv.invoiceDate)}</div>
                </div>
                <DownloadLink invoice={inv} />
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-lg border bg-card shadow-xs md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Number</th>
                  <th className="px-4 py-3 font-medium">Kuupäev</th>
                  <th className="px-4 py-3 font-medium">Klient</th>
                  <th className="px-4 py-3 text-right font-medium">Kokku</th>
                  <th className="w-14 px-2 py-3">
                    <span className="sr-only">PDF</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-2 font-medium whitespace-nowrap">{inv.number}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
                    <td className="max-w-56 truncate px-4 py-2">{inv.customerName}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap tabular-nums">
                      {formatEur(inv.amountTotal)}
                    </td>
                    <td className="px-2 py-1">
                      <DownloadLink invoice={inv} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <TurnoverSummary turnover={data.turnover} />
    </div>
  );
}

function invoiceCount(n: number) {
  return `${n} ${n === 1 ? "arve" : "arvet"}`;
}

function TurnoverSummary({ turnover }: { turnover: Turnover }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="turnover-heading">
      <h2 id="turnover-heading" className="text-lg font-semibold">
        Käive käibemaksuta
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {turnover.companies.map((c) => (
          <Card key={c.companyId}>
            <CardHeader>
              <CardTitle className="text-base">{c.companyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-sm text-muted-foreground">
                    {turnover.year}
                    <span className="block text-xs">{invoiceCount(c.currentYearCount)}</span>
                  </dt>
                  <dd className="text-lg font-semibold text-primary tabular-nums">{formatEur(c.currentYear)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 border-t pt-3">
                  <dt className="text-sm text-muted-foreground">
                    Kokku
                    <span className="block text-xs">{invoiceCount(c.allTimeCount)}</span>
                  </dt>
                  <dd className="font-semibold tabular-nums">{formatEur(c.allTime)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
