import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  salesPersonnelQueryOptions,
  createSalesPerson,
  updateSalesPerson,
  deleteSalesPerson,
  type SalesPerson,
} from "#/utils/queries/salesPersonnelQueries";
import InputField from "#/components/widgets/InputField";
import PhoneField from "#/components/widgets/PhoneField";

export const Route = createFileRoute(
  "/dashboard/car-rental-bookings/sales-personnel/",
)({
  component: ManageSalesPersonnel,
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name }: { name: string }) {
  const colours = [
    "from-emerald-500 to-teal-400",
    "from-blue-500 to-indigo-400",
    "from-violet-500 to-purple-400",
    "from-orange-500 to-amber-400",
    "from-rose-500 to-pink-400",
  ];
  const colour = colours[name.charCodeAt(0) % colours.length];
  return (
    <div
      className={`w-9 h-9 rounded-full bg-gradient-to-br ${colour} flex items-center justify-center shrink-0 shadow-sm`}
    >
      <span className="text-xs font-semibold text-white">
        {getInitials(name)}
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="h-3.5 w-32 bg-gray-100 rounded-md animate-pulse" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-3.5 w-36 bg-gray-100 rounded-md animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-3.5 w-24 bg-gray-100 rounded-md animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 justify-end">
          <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

// ── Inline-editable row ──────────────────────────────────────────────────────

function SalesPersonRow({
  person,
  onSaved,
  onDelete,
}: {
  person: SalesPerson;
  onSaved: () => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [fullname, setFullname] = useState(person.fullname);
  const [phone, setPhone] = useState(person.phone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!fullname.trim() || !phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSalesPerson(person.id, fullname.trim(), phone.trim());
      setEditing(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFullname(person.fullname);
    setPhone(person.phone);
    setEditing(false);
    setError(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  return (
    <>
      <tr
        className={`border-b border-gray-50 transition-colors ${editing ? "bg-emerald-50/40" : "hover:bg-gray-50/60"}`}
      >
        {/* Name */}
        <td className="px-6 py-3.5">
          {editing ? (
            <div onKeyDown={handleKeyDown}>
              <InputField
                id={`edit-name-${person.id}`}
                label=""
                value={fullname}
                onChange={setFullname}
                placeholder="Full name"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar name={person.fullname} />
              <span className="text-sm font-medium text-gray-800">
                {person.fullname}
              </span>
            </div>
          )}
        </td>

        {/* Phone */}
        <td className="px-6 py-3.5">
          {editing ? (
            <div onKeyDown={handleKeyDown}>
              <PhoneField
                id={`edit-phone-${person.id}`}
                label=""
                value={phone}
                onChange={setPhone}
              />
            </div>
          ) : (
            <span className="text-sm text-gray-600 font-mono">
              {person.phone}
            </span>
          )}
        </td>

        {/* Added date */}
        <td className="px-6 py-3.5">
          <span className="text-xs text-gray-400">
            {new Date(person.created_at).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </td>

        {/* Actions */}
        <td className="px-6 py-3.5">
          <div className="flex items-center justify-end gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#2E8B57" }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(person.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Inline error */}
      {editing && error && (
        <tr className="bg-red-50/60">
          <td colSpan={4} className="px-6 py-2">
            <p className="text-xs text-red-600">{error}</p>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Add-person form ──────────────────────────────────────────────────────────

function AddPersonForm({ onAdded }: { onAdded: () => void }) {
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fullname.trim() || !phone.trim()) {
      setError("Both fields are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createSalesPerson(fullname.trim(), phone.trim());
      setFullname("");
      setPhone("");
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#2E8B5715" }}
          >
            <svg
              className="w-4 h-4"
              style={{ color: "#2E8B57" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-800">
            Add Sales Person
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
        <InputField
          id="add-fullname"
          label="Full Name"
          value={fullname}
          onChange={setFullname}
          placeholder="e.g. Julius Moyo"
        />
        <PhoneField
          id="add-phone"
          label="Mobile Number"
          value={phone}
          onChange={setPhone}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 active:scale-[0.98]"
          style={{ backgroundColor: "#2E8B57" }}
        >
          {saving ? "Adding…" : "Add Person"}
        </button>
      </form>
    </div>
  );
}

// ── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({
  name,
  onConfirm,
  onCancel,
  deleting,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Remove Sales Person
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Are you sure you want to remove{" "}
              <span className="font-medium text-gray-700">{name}</span>? This
              action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60"
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

function ManageSalesPersonnel() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery(
    salesPersonnelQueryOptions,
  );

  const [deleteTarget, setDeleteTarget] = useState<SalesPerson | null>(null);
  const [search, setSearch] = useState("");

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSalesPerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_personnel"] });
      setDeleteTarget(null);
    },
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["sales_personnel"] });
  }

  const filtered = (data ?? []).filter(
    (p) =>
      p.fullname.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search),
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Sales Personnel</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Manage car rental sales staff — add, edit, or remove members.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left: table ── */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Table toolbar */}
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">
                  Team members
                </span>
                {!isLoading && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    {filtered.length}
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="relative w-56">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or number…"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2E8B57]/25 focus:border-[#2E8B57] transition-all bg-gray-50 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Mobile Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                  ) : isError ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-sm text-red-500">
                          {error instanceof Error
                            ? error.message
                            : "Failed to load."}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-gray-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                              />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-400">
                            {search
                              ? "No results found"
                              : "No sales personnel yet"}
                          </p>
                          {!search && (
                            <p className="text-xs text-gray-300">
                              Add your first team member using the form →
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((person) => (
                      <SalesPersonRow
                        key={person.id}
                        person={person}
                        onSaved={refresh}
                        onDelete={(id) =>
                          setDeleteTarget(
                            data!.find((p) => p.id === id) ?? null,
                          )
                        }
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right: add form ── */}
        <div className="w-72 shrink-0">
          <AddPersonForm onAdded={refresh} />
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.fullname}
          deleting={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
