import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/car-rental-bookings/")({
  component: CarRentalBookings,
});

function CarRentalBookings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Car Rental Bookings</h1>
      <p className="mt-1 text-sm text-gray-500">
        View and manage car rental bookings.
      </p>
    </div>
  );
}
