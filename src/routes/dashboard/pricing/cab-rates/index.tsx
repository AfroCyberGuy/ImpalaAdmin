import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  cabRatesQueryOptions,
  addCabRate,
  updateCabRate,
  deleteCabRate,
  type CabRate,
} from "#/utils/queries/cabRateQueries";
import { carClassificationsQueryOptions } from "#/utils/queries/carClassificationQueries";

export const Route = createFileRoute("/dashboard/pricing/cab-rates/")({
  component: CabRatesPage,
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function parsePositive(raw: string): number | null {
  const n = parseFloat(raw);
  return isNaN(n) || n < 0 ? null : n;
}

// ── Row ────────────────────────────────────────────────────────────────────────

function CabRateRow({
  item,
  idx,
  classifications,
}: {
  item: CabRate;
  idx: number;
  classifications: { id: number; classification: string }[];
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editClassId, setEditClassId] = useState(item.car_classification_id);
  const [editAmount, setEditAmount] = useState(String(item.amount));

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCabRate(item.id, {
        amount: parsePositive(editAmount) ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cab_rates"] });
      setIsEditing(false);
      toast.success("Cab rate updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCabRate(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cab_rates"] });
      toast.success("Cab rate deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";
  const className = item.car_classifications?.classification ?? "Unknown";

  if (isEditing) {
    return (
      <tr className={rowBg}>
        <td className="px-5 py-3">
          <select
            value={editClassId}
            onChange={(e) => setEditClassId(Number(e.target.value))}
            className="w-full rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
          >
            {classifications.map((c) => (
              <option key={c.id} value={c.id}>
                {c.classification}
              </option>
            ))}
          </select>
        </td>
        <td className="px-5 py-3">
          <input
            type="number"
            min="0"
            step="0.01"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="w-full rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
          />
        </td>
        <td className="px-5 py-3 text-right w-40">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !parsePositive(editAmount)}
              className="whitespace-nowrap rounded-md bg-[#2D5016] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateMutation.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="whitespace-nowrap rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
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
            Delete cab rate for{" "}
            <span className="font-semibold text-gray-900">{className}</span>?
            This cannot be undone.
          </span>
        </td>
        <td className="px-5 py-3.5 text-right w-40">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="whitespace-nowrap rounded-md bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="whitespace-nowrap rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
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
      <td className="px-5 py-3.5 font-medium text-gray-800">{className}</td>
      <td className="px-5 py-3.5 text-gray-800">{fmt(item.amount)}</td>
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

function CabRatesPage() {
  const queryClient = useQueryClient();

  const { data: rates = [], isLoading: ratesLoading } =
    useQuery(cabRatesQueryOptions);
  const { data: classifications = [], isLoading: classLoading } = useQuery(
    carClassificationsQueryOptions,
  );

  const [classId, setClassId] = useState<number | "">("");
  const [amount, setAmount] = useState("");

  const addMutation = useMutation({
    mutationFn: () =>
      addCabRate({
        car_classification_id: classId as number,
        amount: parsePositive(amount) ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cab_rates"] });
      setClassId("");
      setAmount("");
      toast.success("Cab rate added.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isDuplicate =
    classId !== "" && rates.some((r) => r.car_classification_id === classId);

  const canSubmit =
    classId !== "" &&
    !!parsePositive(amount) &&
    !isDuplicate &&
    !addMutation.isPending;

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    addMutation.mutate();
  }

  const isLoading = ratesLoading || classLoading;

  return (
    <div className="flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Cab Rates</h1>
        <p className="text-sm text-gray-500 mb-8">
          Set and manage cab fare rates for each car class.
        </p>

        {/* Add form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-10"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Add New Rate
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Class select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Car Class
              </label>
              <select
                value={classId}
                onChange={(e) =>
                  setClassId(e.target.value ? Number(e.target.value) : "")
                }
                className={`rounded-lg border px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                  isDuplicate
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : "border-gray-300 focus:border-[#2D5016] focus:ring-[#2D5016]"
                }`}
              >
                <option value="">Select a class…</option>
                {classifications.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.classification}
                  </option>
                ))}
              </select>
              {isDuplicate && (
                <p className="text-xs text-red-500 mt-0.5">
                  A rate for this class already exists. Edit the existing entry
                  instead.
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Amount (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-[#2D5016] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addMutation.isPending ? "Saving…" : "Add Rate"}
            </button>
          </div>
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
                  Amount
                </th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600 w-40">
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
              ) : rates.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    No cab rates yet. Add one above.
                  </td>
                </tr>
              ) : (
                rates.map((r, idx) => (
                  <CabRateRow
                    key={r.id}
                    item={r}
                    idx={idx}
                    classifications={classifications}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
