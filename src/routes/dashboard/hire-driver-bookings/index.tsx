import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  driverBookingsQueryOptions,
  deleteDriverBooking,
  type DriverBooking,
} from "#/utils/queries/hireDriverQueries";

export const Route = createFileRoute("/dashboard/hire-driver-bookings/")({
  component: HireDriverBookings,
});

const PAGE_SIZE = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(val: string | null): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCost(val: number | null): string {
  if (val == null) return "—";
  return `$${val.toFixed(2)}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ClientAvatar({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
      <span className="text-xs font-semibold text-white">{initials}</span>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>;

  const s = status.toLowerCase();
  const styles: Record<string, string> = {
    assigned: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    cancelled: "bg-red-50 text-red-600 ring-red-200",
    completed: "bg-blue-50 text-blue-700 ring-blue-200",
  };

  const cls = styles[s] ?? "bg-gray-50 text-gray-600 ring-gray-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-3 w-28 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      </td>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-3.5 bg-gray-100 rounded-md animate-pulse"
            style={{ width: `${50 + ((i * 17) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => {
      if (totalPages <= 7) return true;
      if (p === 1 || p === totalPages) return true;
      if (Math.abs(p - page) <= 1) return true;
      return false;
    })
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (
        idx > 0 &&
        typeof arr[idx - 1] === "number" &&
        (p as number) - (arr[idx - 1] as number) > 1
      ) {
        acc.push("…");
      }
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      {pages.map((item, idx) =>
        item === "…" ? (
          <span
            key={`e-${idx}`}
            className="px-1.5 text-xs text-gray-400 select-none"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPage(item as number)}
            className={[
              "min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors",
              item === page
                ? "text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100",
            ].join(" ")}
            style={item === page ? { backgroundColor: "#2E8B57" } : undefined}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </div>
  );
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({
  booking,
  onCancel,
  onConfirm,
  isPending,
}: {
  booking: DriverBooking;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(2px)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 shrink-0">
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
            <h3 className="text-sm font-bold text-gray-900">Delete booking</h3>
            <p className="text-xs text-gray-500 mt-1">
              Are you sure you want to delete booking #{booking.id} for{" "}
              <span className="font-medium text-gray-700">
                {booking.client_name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isPending ? (
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function HireDriverBookings() {
  const {
    data: bookings = [],
    isLoading,
    error,
  } = useQuery(driverBookingsQueryOptions);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DriverBooking | null>(null);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDriverBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-bookings"] });
      setDeleteTarget(null);
    },
  });

  function resetPage() {
    setPage(1);
  }

  const statusOptions = useMemo(() => {
    const set = new Set(bookings.map((b) => b.booking_status).filter(Boolean));
    return Array.from(set) as string[];
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return bookings.filter((b) => {
      if (q) {
        const name = b.client_name.toLowerCase();
        const phone = b.phonenumber.toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      if (filterStatus !== "all") {
        if (
          (b.booking_status ?? "").toLowerCase() !== filterStatus.toLowerCase()
        )
          return false;
      }
      return true;
    });
  }, [bookings, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const COL_COUNT = 7;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hire Driver Bookings
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {isLoading
            ? "Loading…"
            : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
        </p>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
          {/* Search */}
          <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by client name or phone…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                resetPage();
              }}
              className="text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition cursor-pointer"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            >
              <option value="all">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  "Customer",
                  "Booking",
                  "Cost",
                  "Booking Date",
                  "Required Class",
                  "Booking Status",
                  "Actions",
                ].map((col, i) => (
                  <th
                    key={col}
                    className={[
                      "px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap",
                      i === COL_COUNT - 1 ? "text-right" : "text-left",
                    ].join(" ")}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!isLoading && error && (
                <tr>
                  <td colSpan={COL_COUNT} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8 text-red-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-red-500">
                        Failed to load bookings
                      </p>
                      <p className="text-xs text-gray-400">
                        {(error as Error).message}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={COL_COUNT} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8 text-gray-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-400">
                        No bookings found
                      </p>
                      {(search || filterStatus !== "all") && (
                        <p className="text-xs text-gray-400">
                          Try adjusting your search or filters
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                paged.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    onDelete={() => setDeleteTarget(booking)}
                  />
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400 order-2 sm:order-1">
              Showing{" "}
              <span className="font-medium text-gray-600">
                {(safePage - 1) * PAGE_SIZE + 1}
              </span>
              {" – "}
              <span className="font-medium text-gray-600">
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-600">
                {filtered.length}
              </span>{" "}
              bookings
            </p>
            <div className="order-1 sm:order-2">
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onPage={setPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          booking={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// ── Booking Row ────────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  onDelete,
}: {
  booking: DriverBooking;
  onDelete: () => void;
}) {
  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      {/* Customer */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <ClientAvatar
            src={booking.client_avatar}
            name={booking.client_name}
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {booking.client_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              Phone: {booking.phonenumber}
            </p>
          </div>
        </div>
      </td>

      {/* Booking / hire type */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-gray-700">{booking.hire_type ?? "—"}</span>
      </td>

      {/* Cost */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="font-semibold text-gray-900">
          {formatCost(booking.amount)}
        </span>
      </td>

      {/* Booking date */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-gray-600">
          {formatDate(booking.date_of_hire)}
        </span>
      </td>

      {/* Required class */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        {booking.required_class ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200">
            {booking.required_class}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Booking Status */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <BookingStatusBadge status={booking.booking_status} />
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1">
          <Link
            to="/dashboard/hire-driver-bookings/$bookingId"
            params={{ bookingId: String(booking.id) }}
            title="View booking"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#2E8B57] hover:bg-emerald-50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            View
          </Link>
          <button
            onClick={onDelete}
            title="Delete booking"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
