import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/system-users/")({
  component: SystemUsers,
});

function SystemUsers() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">System Users</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage admin and system user accounts.
      </p>
    </div>
  );
}
