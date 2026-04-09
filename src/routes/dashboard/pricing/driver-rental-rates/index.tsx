import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  hireDriverTypesQueryOptions,
  hireDriverRatesQueryOptions,
  addHireDriverType,
  updateHireDriverType,
  deleteHireDriverType,
  addHireDriverRate,
  updateHireDriverRate,
  deleteHireDriverRate,
  type HireDriverType,
  type HireDriverRate,
} from "#/utils/queries/hireDriverQueries";

export const Route = createFileRoute("/dashboard/pricing/driver-rental-rates/")(
  {
    component: DriverRentalRatesPage,
  },
);

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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Hire Type Row ──────────────────────────────────────────────────────────────

function HireTypeRow({ item, idx }: { item: HireDriverType; idx: number }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editName, setEditName] = useState(item.hire_type);

  const updateMutation = useMutation({
    mutationFn: () => updateHireDriverType(item.id, editName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hire_driver_types"] });
      setIsEditing(false);
      toast.success("Hire type updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteHireDriverType(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hire_driver_types"] });
      queryClient.invalidateQueries({ queryKey: ["hire_driver_rates"] });
      toast.success("Hire type deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";

  if (isEditing) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
      >
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
        />
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || !editName.trim()}
          className="whitespace-nowrap rounded-md bg-[#2D5016] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updateMutation.isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setEditName(item.hire_type);
          }}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
      >
        <span className="flex-1 text-sm text-gray-700">
          Delete{" "}
          <span className="font-semibold text-gray-900">{item.hire_type}</span>?
          This cannot be undone.
        </span>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="whitespace-nowrap rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {deleteMutation.isPending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {item.hire_type}
        </p>
        <p className="text-xs text-gray-400">
          Created on: {fmtDate(item.created_at)}
        </p>
      </div>
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
  );
}

// ── Hire Rate Row ──────────────────────────────────────────────────────────────

function HireRateRow({ item, idx }: { item: HireDriverRate; idx: number }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editAmount, setEditAmount] = useState(String(item.amount));

  const updateMutation = useMutation({
    mutationFn: () =>
      updateHireDriverRate(item.id, parsePositive(editAmount) ?? 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hire_driver_rates"] });
      setIsEditing(false);
      toast.success("Rate updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteHireDriverRate(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hire_driver_rates"] });
      toast.success("Rate deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";
  const hireTypeName = item.hire_driver_types?.hire_type ?? "Unknown";
  const modifiedDate = item.updated_at ?? item.created_at;

  if (isEditing) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{hireTypeName}</p>
        </div>
        <input
          autoFocus
          type="number"
          min="0"
          step="0.01"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          className="w-32 rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
        />
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || !parsePositive(editAmount)}
          className="whitespace-nowrap rounded-md bg-[#2D5016] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updateMutation.isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setEditAmount(String(item.amount));
          }}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
      >
        <span className="flex-1 text-sm text-gray-700">
          Delete rate for{" "}
          <span className="font-semibold text-gray-900">{hireTypeName}</span>?
          This cannot be undone.
        </span>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="whitespace-nowrap rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {deleteMutation.isPending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{hireTypeName}</p>
        <p className="text-xs font-medium text-gray-700 mt-0.5">
          {fmt(item.amount)}
        </p>
        <p className="text-xs text-gray-400">
          Modified on: {fmtDate(modifiedDate)}
        </p>
      </div>
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
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function DriverRentalRatesPage() {
  const queryClient = useQueryClient();

  const { data: hireTypes = [], isLoading: typesLoading } = useQuery(
    hireDriverTypesQueryOptions,
  );
  const { data: rates = [], isLoading: ratesLoading } = useQuery(
    hireDriverRatesQueryOptions,
  );

  // Add hire type form
  const [newHireType, setNewHireType] = useState("");

  const addTypeMutation = useMutation({
    mutationFn: () => addHireDriverType(newHireType.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hire_driver_types"] });
      setNewHireType("");
      toast.success("Hire type added.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Add hire rate form
  const [typeId, setTypeId] = useState<number | "">("");
  const [amount, setAmount] = useState("");

  const isDuplicateRate =
    typeId !== "" && rates.some((r) => r.hire_driver_type_id === typeId);

  const canAddRate =
    typeId !== "" && !!parsePositive(amount) && !isDuplicateRate;

  const addRateMutation = useMutation({
    mutationFn: () =>
      addHireDriverRate({
        hire_driver_type_id: typeId as number,
        amount: parsePositive(amount) ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hire_driver_rates"] });
      setTypeId("");
      setAmount("");
      toast.success("Hire driver rate added.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Driver Hiring Rates
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Manage hire driver types and set rates for each type.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ── Left: Hire Types ── */}
        <div className="flex flex-col gap-6">
          {/* Add hire type form */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Add Hire Driver Type
            </h2>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-medium text-gray-600">
                Hire driver type
              </label>
              <input
                type="text"
                value={newHireType}
                onChange={(e) => setNewHireType(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    newHireType.trim() &&
                    !addTypeMutation.isPending
                  ) {
                    addTypeMutation.mutate();
                  }
                }}
                placeholder="Enter hire type name"
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => addTypeMutation.mutate()}
                disabled={!newHireType.trim() || addTypeMutation.isPending}
                className="rounded-lg bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addTypeMutation.isPending ? "Adding…" : "Add Hiring Type"}
              </button>
            </div>
          </div>

          {/* Hire types list */}
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {typesLoading ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                Loading…
              </p>
            ) : hireTypes.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                No hire types yet. Add one above.
              </p>
            ) : (
              hireTypes.map((type, idx) => (
                <HireTypeRow key={type.id} item={type} idx={idx} />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Hire Rates ── */}
        <div className="flex flex-col gap-6">
          {/* Add rate form */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Add Hire Driver Rate
            </h2>
            <div className="flex flex-col gap-4 mb-4">
              {/* Hire type select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Select hiring rate
                </label>
                <select
                  value={typeId}
                  onChange={(e) =>
                    setTypeId(e.target.value ? Number(e.target.value) : "")
                  }
                  className={`rounded-lg border px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                    isDuplicateRate
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                      : "border-gray-300 focus:border-[#2D5016] focus:ring-[#2D5016]"
                  }`}
                >
                  <option value="">Select hiring rate</option>
                  {hireTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.hire_type}
                    </option>
                  ))}
                </select>
                {isDuplicateRate && (
                  <p className="text-xs text-red-500 mt-0.5">
                    A rate for this hire type already exists. Edit the existing
                    entry instead.
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter hiring amount"
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => addRateMutation.mutate()}
                disabled={!canAddRate || addRateMutation.isPending}
                className="rounded-lg bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addRateMutation.isPending ? "Saving…" : "Add new rate"}
              </button>
            </div>
          </div>

          {/* Rates list */}
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {ratesLoading ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                Loading…
              </p>
            ) : rates.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                No hire driver rates yet. Add one above.
              </p>
            ) : (
              rates.map((rate, idx) => (
                <HireRateRow key={rate.id} item={rate} idx={idx} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
