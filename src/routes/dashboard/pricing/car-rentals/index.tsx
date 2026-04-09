import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  rentalPricesQueryOptions,
  addRentalPrice,
  updateRentalPrice,
  deleteRentalPrice,
  type RentalPrice,
} from "#/utils/queries/rentalPriceQueries";
import { carClassificationsQueryOptions } from "#/utils/queries/carClassificationQueries";

export const Route = createFileRoute("/dashboard/pricing/car-rentals/")({
  component: CarRentalPricingPage,
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

function RentalPriceRow({
  item,
  idx,
  classifications,
}: {
  item: RentalPrice;
  idx: number;
  classifications: { id: number; classification: string }[];
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editClassId, setEditClassId] = useState(item.car_classification_id);
  const [editAmount, setEditAmount] = useState(String(item.amount));
  const [editDeposit, setEditDeposit] = useState(
    item.deposit != null ? String(item.deposit) : "",
  );
  const [editRefundable, setEditRefundable] = useState(
    item.refundable_deposit != null ? String(item.refundable_deposit) : "",
  );

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRentalPrice(item.id, {
        amount: parsePositive(editAmount) ?? 0,
        deposit: parsePositive(editDeposit),
        refundable_deposit: parsePositive(editRefundable),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental_prices"] });
      setIsEditing(false);
      toast.success("Rental price updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRentalPrice(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental_prices"] });
      toast.success("Rental price deleted.");
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
        <td className="px-5 py-3">
          <input
            type="number"
            min="0"
            step="0.01"
            value={editDeposit}
            onChange={(e) => setEditDeposit(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
          />
        </td>
        <td className="px-5 py-3">
          <input
            type="number"
            min="0"
            step="0.01"
            value={editRefundable}
            onChange={(e) => setEditRefundable(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
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
        <td className="px-5 py-3.5" colSpan={4}>
          <span className="text-sm text-gray-700">
            Delete pricing for{" "}
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
      <td className="px-5 py-3.5 text-gray-500">{fmt(item.deposit)}</td>
      <td className="px-5 py-3.5 text-gray-500">
        {fmt(item.refundable_deposit)}
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

function CarRentalPricingPage() {
  const queryClient = useQueryClient();

  const { data: prices = [], isLoading: pricesLoading } = useQuery(
    rentalPricesQueryOptions,
  );
  const { data: classifications = [], isLoading: classLoading } = useQuery(
    carClassificationsQueryOptions,
  );

  const [classId, setClassId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [refundable, setRefundable] = useState("");

  const addMutation = useMutation({
    mutationFn: () =>
      addRentalPrice({
        car_classification_id: classId as number,
        amount: parsePositive(amount) ?? 0,
        deposit: parsePositive(deposit),
        refundable_deposit: parsePositive(refundable),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental_prices"] });
      setAmount("");
      setDeposit("");
      setRefundable("");
      toast.success("Rental price added.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isDuplicate =
    classId !== "" && prices.some((p) => p.car_classification_id === classId);

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

  const isLoading = pricesLoading || classLoading;

  return (
    <div className="flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Car Rental Pricing
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Manage per-day rental rates and deposits for each car class.
        </p>

        {/* Add form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-10"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Add New Price
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
                  A price for this class already exists. Edit the existing entry
                  instead.
                </p>
              )}
            </div>

            {/* Amount per day */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Amount per day (USD)
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

            {/* Deposit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Deposit (USD) <span className="text-gray-400">— optional</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="0.00"
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
              />
            </div>

            {/* Refundable deposit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Refundable Deposit (USD){" "}
                <span className="text-gray-400">— optional</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={refundable}
                onChange={(e) => setRefundable(e.target.value)}
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
              {addMutation.isPending ? "Saving…" : "Add Price"}
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
                  Per Day
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">
                  Deposit
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">
                  Refundable Deposit
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
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    Loading…
                  </td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    No rental prices yet. Add one above.
                  </td>
                </tr>
              ) : (
                prices.map((p, idx) => (
                  <RentalPriceRow
                    key={p.id}
                    item={p}
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
