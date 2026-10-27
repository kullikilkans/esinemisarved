"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomerDialog } from "@/components/customer-dialog";
import { ErrorState } from "@/components/error-state";
import type { Customer } from "@/lib/customer";
import { fetchJson } from "@/lib/fetch-json";

function invoiceLabel(n: number) {
  return `${n} ${n === 1 ? "arve" : "arvet"}`;
}

function byName(a: Customer, b: Customer) {
  return a.name.localeCompare(b.name, "et");
}

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(() => {
    fetchJson<Customer[]>("/api/customers")
      .then(setCustomers)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(load, [load]);

  const retry = () => {
    setLoadError(null);
    setCustomers(null);
    load();
  };

  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = query.trim().toLocaleLowerCase("et");
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.regCode, c.email, c.address].some((v) => v?.toLocaleLowerCase("et").includes(q)),
    );
  }, [customers, query]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setDialogOpen(true);
  }

  function handleSaved(saved: Customer) {
    setCustomers((list) => {
      const rest = (list ?? []).filter((c) => c.id !== saved.id);
      return [...rest, saved].sort(byName);
    });
    setDialogOpen(false);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await fetchJson(`/api/customers/${deleting.id}`, { method: "DELETE" });
      setCustomers((list) => (list ?? []).filter((c) => c.id !== deleting.id));
      toast.success("Klient kustutatud");
      setDeleting(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loadError) return <ErrorState message={loadError} onRetry={retry} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Otsi klienti"
            aria-label="Otsi klienti"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openAdd}>
          <Plus />
          Uus klient
        </Button>
      </div>

      {!customers ? (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {customers.length === 0 ? "Kliente pole veel lisatud." : "Otsingule vastavaid kliente ei leitud."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((c) => (
            <li key={c.id} className="flex items-start gap-2 rounded-lg border bg-card p-4 shadow-xs">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">
                  {c.regCode ? `Reg. kood ${c.regCode} · ` : ""}
                  {invoiceLabel(c.invoiceCount)}
                </div>
                {c.address && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" aria-label={`Muuda: ${c.name}`} onClick={() => openEdit(c)}>
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Kustuta: ${c.name}`}
                onClick={() => setDeleting(c)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editing}
        onSaved={handleSaved}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          {deleting && deleting.invoiceCount > 0 ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Klienti ei saa kustutada</AlertDialogTitle>
                <AlertDialogDescription>
                  Kliendil {deleting.name} on {invoiceLabel(deleting.invoiceCount)}. Väljastatud arved
                  peavad säilima, seega saab kustutada ainult kliente, kellel arveid pole. Kliendi andmeid
                  saad endiselt muuta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Selge</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Kustutada klient?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleting?.name} kustutatakse jäädavalt. Seda ei saa tagasi võtta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Loobu</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={deleteBusy}>
                  {deleteBusy && <Loader2 className="animate-spin" />}
                  Kustuta
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
