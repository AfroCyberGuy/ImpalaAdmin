import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  carClassificationsQueryOptions,
  addCarClassification,
  updateCarClassification,
  deleteCarClassification,
  type CarClassification,
} from "#/utils/queries/carClassificationQueries";

export const Route = createFileRoute("/dashboard/pricing/model/")({
  component: CarClassificationPage,
});

// ── Row ────────────────────────────────────────────────────────────────────────

function ClassificationRow({
  item,
  idx,
}: {
  item: CarClassification;
  idx: number;
}) {
  const queryClient = useQueryClient();
  const [editValue, setEditValue] = useState(item.classification);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => updateCarClassification(item.id, editValue.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car_classifications"] });
      setIsEditing(false);
      toast.success("Classification updated successfully.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCarClassification(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car_classifications"] });
      toast.success("Classification deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";

  if (isEditing) {
    return (
      <tr className={rowBg}>
        <td className="px-5 py-3" colSpan={2}>
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
          />
        </td>
        <td className="px-5 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !editValue.trim()}
              className="rounded-md bg-[#2D5016] px-3 py-1 text-xs font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateMutation.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditValue(item.classification);
                setIsEditing(false);
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  if (confirmDelete) {
    return (
      <tr className={rowBg}>
        <td className="px-5 py-3.5" colSpan={2}>
          <span className="text-sm text-gray-700">
            Delete{" "}
            <span className="font-semibold text-gray-900">
              {item.classification}
            </span>
            ? This cannot be undone.
          </span>
        </td>
        <td className="px-5 py-3.5 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={rowBg}>
      <td className="px-5 py-3.5 font-medium text-gray-800">
        {item.classification}
      </td>
      <td className="px-5 py-3.5 text-gray-500">
        {new Date(item.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function CarClassificationPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data: classifications = [], isLoading } = useQuery(
    carClassificationsQueryOptions,
  );

  const addMutation = useMutation({
    mutationFn: addCarClassification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car_classifications"] });
      setName("");
      toast.success("Car classification added.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  }

  return (
    <div className="flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Car Classification
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Manage car classes used across the platform.
        </p>

        {/* Add form */}
        <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter car class name"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !name.trim()}
            className="rounded-lg bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {addMutation.isPending ? "Saving…" : "Add Classification"}
          </button>
        </form>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left font-semibold text-gray-600">
                  Car Class
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">
                  Created
                </th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    Loading…
                  </td>
                </tr>
              ) : classifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    No car classifications yet. Add one above.
                  </td>
                </tr>
              ) : (
                classifications.map((c, idx) => (
                  <ClassificationRow key={c.id} item={c} idx={idx} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
