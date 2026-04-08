import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/shuttle-trips/")({
  component: ShuttleTrips,
});

function ShuttleTrips() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Shuttle Trips</h1>
      <p className="mt-1 text-sm text-gray-500">
        View and manage all shuttle trip records.
      </p>
    </div>
  );
}
