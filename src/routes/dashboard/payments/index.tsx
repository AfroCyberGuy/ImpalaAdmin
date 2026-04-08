import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/payments/")({
  component: Payments,
});

function Payments() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
      <p className="mt-1 text-sm text-gray-500">
        Track and manage payment transactions.
      </p>
    </div>
  );
}
