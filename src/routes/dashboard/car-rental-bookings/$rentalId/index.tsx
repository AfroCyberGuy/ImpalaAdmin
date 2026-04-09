import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { carRentalBookingDetailQueryOptions } from "#/utils/queries/carRentalQueries";
import { supabase } from "#/utils/supabase";

export const Route = createFileRoute(
  "/dashboard/car-rental-bookings/$rentalId/",
)({
  component: ViewCarRentalBooking,
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface RentalStatus {
  id: number;
  status: string;
}

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
  return `$${val.toFixed(2)}USD`;
}

// ── Query helpers ──────────────────────────────────────────────────────────────

async function fetchRentalStatuses(): Promise<RentalStatus[]> {
  const { data, error } = await supabase
    .from("rental_statuses")
    .select("id, status")
    .order("id");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function updateCarRentalStatus(
  rentalId: number,
  statusId: number,
): Promise<void> {
  const { error } = await supabase
    .from("car_rentals")
    .update({ rental_status_id: statusId })
    .eq("id", rentalId);
  if (error) throw new Error(error.message);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ src, name }: { src: string | null; name: string }) {
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
        className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md shrink-0"
      />
    );
  }
  return (
    <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-4 ring-white shadow-md shrink-0">
      <span className="text-xl font-bold text-white">{initials}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400 text-sm">—</span>;
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    initiated: "bg-blue-50 text-blue-700 ring-blue-200",
    hired: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    returned: "bg-purple-50 text-purple-700 ring-purple-200",
    overdue: "bg-red-50 text-red-600 ring-red-200",
    cancelled: "bg-gray-50 text-gray-500 ring-gray-200",
  };
  const cls = map[s] ?? "bg-gray-50 text-gray-600 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-6 py-3.5 border-b border-gray-50 last:border-0 ${highlight ? "bg-gray-50/60 -mx-5 px-5 rounded-lg" : ""}`}
    >
      <span
        className={`text-sm shrink-0 ${highlight ? "font-semibold text-gray-700" : "text-gray-500"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm text-right ${highlight ? "font-bold text-gray-900 text-base" : "font-medium text-gray-900"}`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50 bg-gray-50/40">
        <span className="text-[#2E8B57]">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 bg-gray-100 rounded" />
        <div className="h-4 w-36 bg-gray-100 rounded-lg" />
      </div>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-56" />
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-56" />
      </div>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-40" />
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function StatusToast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gray-900 text-white shadow-2xl"
      role="status"
    >
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 shrink-0">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// ── Update Status Dialog ───────────────────────────────────────────────────────

function UpdateStatusDialog({
  currentStatus,
  rentalId,
  onClose,
  onSuccess,
}: {
  currentStatus: string | null;
  rentalId: number;
  onClose: () => void;
  onSuccess: (newStatus: string) => void;
}) {
  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ["rental-statuses"],
    queryFn: fetchRentalStatuses,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (statusId: number) => updateCarRentalStatus(rentalId, statusId),
    onSuccess: (_data, statusId) => {
      queryClient.invalidateQueries({
        queryKey: ["car-rental-booking", rentalId],
      });
      queryClient.invalidateQueries({ queryKey: ["car-rental-bookings"] });
      const selected = statuses.find((s) => s.id === statusId);
      onSuccess(selected?.status ?? "Updated");
      onClose();
    },
  });

  const statusColors: Record<string, string> = {
    pending: "text-amber-700 bg-amber-50 ring-amber-200",
    initiated: "text-blue-700 bg-blue-50 ring-blue-200",
    hired: "text-emerald-700 bg-emerald-50 ring-emerald-200",
    returned: "text-purple-700 bg-purple-50 ring-purple-200",
    overdue: "text-red-600 bg-red-50 ring-red-200",
    cancelled: "text-gray-500 bg-gray-50 ring-gray-200",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)",
      }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Update Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select a new status for this booking
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Status list */}
        <div className="px-4 py-3 space-y-2 max-h-80 overflow-y-auto">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}

          {!isLoading &&
            statuses.map((s) => {
              const isCurrent =
                s.status.toLowerCase() === (currentStatus ?? "").toLowerCase();
              const colorCls =
                statusColors[s.status.toLowerCase()] ??
                "text-gray-600 bg-gray-50 ring-gray-200";

              return (
                <button
                  key={s.id}
                  onClick={() => mutation.mutate(s.id)}
                  disabled={mutation.isPending || isCurrent}
                  className={[
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                    isCurrent
                      ? "border-[#2E8B57]/30 bg-[#2E8B57]/5 cursor-default"
                      : "border-gray-100 hover:border-[#2E8B57]/30 hover:bg-gray-50 cursor-pointer",
                    mutation.isPending && !isCurrent
                      ? "opacity-50 cursor-not-allowed"
                      : "",
                  ].join(" ")}
                >
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${colorCls}`}
                  >
                    {s.status}
                  </span>

                  {isCurrent && (
                    <span className="text-xs text-[#2E8B57] font-medium">
                      Current
                    </span>
                  )}

                  {!isCurrent && mutation.isPending && (
                    <svg
                      className="w-4 h-4 text-gray-300 animate-spin"
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
                  )}

                  {!isCurrent && !mutation.isPending && (
                    <svg
                      className="w-4 h-4 text-gray-300 group-hover:text-[#2E8B57]"
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
                  )}
                </button>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/40">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconCar() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function IconCash() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    </svg>
  );
}

function IconNote() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function ViewCarRentalBooking() {
  const { rentalId } = Route.useParams();
  const id = Number(rentalId);

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery(carRentalBookingDetailQueryOptions(id));

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonDetail />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-3">
        <svg
          className="w-10 h-10 text-red-300"
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
          Failed to load booking
        </p>
        <p className="text-xs text-gray-400">
          {error ? (error as Error).message : "Booking not found"}
        </p>
        <Link
          to="/dashboard/car-rental-bookings"
          className="mt-2 text-xs font-medium text-[#2E8B57] hover:underline"
        >
          Back to bookings
        </Link>
      </div>
    );
  }

  const hireCost =
    booking.cost_per_day != null && booking.period != null
      ? booking.cost_per_day * booking.period
      : null;

  const grandTotal =
    hireCost != null && booking.deposit != null
      ? hireCost + booking.deposit
      : (booking.total_cost ?? null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link + heading */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/car-rental-bookings"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Back to bookings"
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
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Rental Booking #{booking.id}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Created {formatDate(booking.created_at)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={booking.rental_status} />
          <button
            onClick={() => setShowStatusDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all active:scale-95"
            style={{ backgroundColor: "#2E8B57" }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Update Status
          </button>
        </div>
      </div>

      {/* Client card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <Avatar src={booking.client_avatar} name={booking.client_name} />
          <div className="min-w-0">
            <p className="text-lg font-bold text-gray-900 truncate">
              {booking.client_name}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Phone: {booking.phonenumber ?? "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Driver's Licence: {booking.drivers_licence}
            </p>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rental info */}
        <SectionCard title="Car Rental Information" icon={<IconCar />}>
          <InfoRow label="Vehicle Type" value={booking.classification ?? "—"} />
          <InfoRow
            label="Booking Date"
            value={formatDate(booking.booking_date)}
          />
          <InfoRow
            label="Collection Date"
            value={formatDate(booking.from_date)}
          />
          <InfoRow label="Returning Date" value={formatDate(booking.to_date)} />
          <InfoRow label="Days" value={booking.period ?? "—"} />
        </SectionCard>

        {/* Cost breakdown */}
        <SectionCard title="Cost Breakdown" icon={<IconCash />}>
          <InfoRow
            label="Daily Rate"
            value={formatCost(booking.cost_per_day)}
          />
          <InfoRow label="Deposit" value={formatCost(booking.deposit)} />
          <InfoRow
            label={
              booking.cost_per_day != null && booking.period != null
                ? `Hire Cost: Daily Rate $${booking.cost_per_day.toFixed(2)} × ${booking.period} days`
                : "Hire Cost"
            }
            value={formatCost(hireCost)}
          />
          <InfoRow
            label={
              hireCost != null && booking.deposit != null
                ? `Total: $${hireCost.toFixed(2)} + Deposit: $${booking.deposit.toFixed(2)}`
                : "Total Cost"
            }
            value={
              grandTotal != null ? (
                <span className="text-base font-bold text-gray-900">
                  ${grandTotal.toFixed(2)}
                </span>
              ) : (
                "—"
              )
            }
            highlight
          />
        </SectionCard>
      </div>

      {/* Comments */}
      {booking.comments && (
        <SectionCard title="Comments" icon={<IconNote />}>
          <p className="text-sm text-gray-600 py-3.5 leading-relaxed">
            {booking.comments}
          </p>
        </SectionCard>
      )}

      {/* Dates card */}
      <SectionCard title="Booking Timeline" icon={<IconCalendar />}>
        <div className="grid grid-cols-3 divide-x divide-gray-50 py-2">
          {[
            { label: "Booked on", value: formatDate(booking.booking_date) },
            { label: "Pickup", value: formatDate(booking.from_date) },
            { label: "Return", value: formatDate(booking.to_date) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-3 gap-1">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-sm font-semibold text-gray-800 text-center">
                {value}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Update Status Dialog */}
      {showStatusDialog && (
        <UpdateStatusDialog
          currentStatus={booking.rental_status}
          rentalId={id}
          onClose={() => setShowStatusDialog(false)}
          onSuccess={(newStatus) =>
            setToast(`Status updated to "${newStatus}"`)
          }
        />
      )}

      {/* Toast */}
      {toast && <StatusToast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
