import { InvoicesView } from "@/components/invoices-view";

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Arved</h1>
      <InvoicesView />
    </div>
  );
}
