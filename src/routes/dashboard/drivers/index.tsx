import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/drivers/")({
  component: ViewDrivers,
});

function ViewDrivers() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">View Drivers</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage all registered drivers.
      </p>
    </div>
  );
}
