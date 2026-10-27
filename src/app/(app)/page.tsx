import { NewInvoiceView } from "@/components/new-invoice-view";

export default function NewInvoicePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Uus arve</h1>
      <NewInvoiceView />
    </div>
  );
}
