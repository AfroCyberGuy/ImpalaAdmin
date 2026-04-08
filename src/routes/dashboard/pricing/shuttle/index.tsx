import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/pricing/shuttle/")({
  component: ShuttlePricing,
});

function ShuttlePricing() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">
        City to City Shuttle Pricing
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Set pricing for city to city shuttle routes.
      </p>
    </div>
  );
}
