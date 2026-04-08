import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/pricing/driver-rental-rates/")(
  {
    component: DriverRentalRates,
  },
);

function DriverRentalRates() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Driver Rental Rates</h1>
      <p className="mt-1 text-sm text-gray-500">
        Configure driver rental pricing.
      </p>
    </div>
  );
}
