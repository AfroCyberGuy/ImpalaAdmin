import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/pricing/model/")({
  component: SetPriceModel,
});

function SetPriceModel() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Set Price Model</h1>
      <p className="mt-1 text-sm text-gray-500">
        Configure pricing models for services.
      </p>
    </div>
  );
}
