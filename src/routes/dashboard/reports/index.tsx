import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/reports/")({
  component: ViewReports,
});

function ViewReports() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">View Reports</h1>
      <p className="mt-1 text-sm text-gray-500">
        Analytics and business reports.
      </p>
    </div>
  );
}
