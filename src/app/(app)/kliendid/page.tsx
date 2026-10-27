import { CustomersView } from "@/components/customers-view";

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Kliendid</h1>
      <CustomersView />
    </div>
  );
}
