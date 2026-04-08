import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/car-rental-bookings/sales-personnel/",
)({
  component: ManageSalesPersonnel,
});

function ManageSalesPersonnel() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">
        Manage Sales Personnel
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Add and manage car rental sales staff.
      </p>
    </div>
  );
}
