import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/cab-trips/")({
  component: CabTrips,
});

function CabTrips() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Cab Trips</h1>
      <p className="mt-1 text-sm text-gray-500">
        View and manage all cab trip records.
      </p>
    </div>
  );
}
