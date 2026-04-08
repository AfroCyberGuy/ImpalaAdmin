import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/hire-driver-bookings/")({
  component: HireDriverBookings,
});

function HireDriverBookings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Hire Driver Bookings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage driver hire booking requests.
      </p>
    </div>
  );
}
