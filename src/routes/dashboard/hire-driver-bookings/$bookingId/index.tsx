import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  driverBookingDetailQueryOptions,
  assignDriverToHireBooking,
} from "#/utils/queries/hireDriverQueries";
import {
  driversQueryOptions,
  type Driver,
} from "#/utils/queries/driverQueries";

export const Route = createFileRoute(
  "/dashboard/hire-driver-bookings/$bookingId/",
)({
  component: ViewHireDriverBooking,
});

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

// ── Shared sub-components ──────────────────────────────────────────────────────

function Avatar({
  src,
  name,
  size = "md",
}: {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dim =
    size === "lg"
      ? "w-16 h-16 text-lg"
      : size === "sm"
        ? "w-8 h-8 text-xs"
        : "w-11 h-11 text-sm";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-linear-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0`}
    >
      <span className="font-semibold text-white">{initials}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400 text-sm">—</span>;
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    assigned: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    cancelled: "bg-red-50 text-red-600 ring-red-200",
    completed: "bg-blue-50 text-blue-700 ring-blue-200",
    "in transit": "bg-blue-50 text-blue-700 ring-blue-200",
  };
  const cls = map[s] ?? "bg-gray-50 text-gray-600 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">
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
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
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
      <div className="h-5 w-48 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-48" />
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-40" />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-48" />
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-40" />
        </div>
      </div>
    </div>
  );
}

// ── Success toast ──────────────────────────────────────────────────────────────

function AssignSuccessToast({
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
      className="fixed bottom-6 right-6 z-60 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gray-900 text-white shadow-2xl"
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

// ── Assign Driver Dialog ───────────────────────────────────────────────────────

const DIALOG_PAGE_SIZE = 10;

type AssignStep = "idle" | "assigning" | "notifying" | "done";

function StepProgress({ step }: { step: AssignStep }) {
  if (step === "idle" || step === "done") return null;

  const steps: { key: AssignStep; label: string }[] = [
    { key: "assigning", label: "Assigning driver" },
    { key: "notifying", label: "Sending notifications" },
  ];

  return (
    <div className="mx-6 mt-3 mb-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2E8B57]/5 border border-[#2E8B57]/15 shrink-0">
      {steps.map((s, idx) => {
        const isActive = step === s.key;
        const isDone = s.key === "assigning" && step === "notifying";
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div
              className={[
                "flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all duration-300",
                isDone
                  ? "bg-[#2E8B57]"
                  : isActive
                    ? "bg-[#2E8B57]/15 ring-2 ring-[#2E8B57]/40"
                    : "bg-gray-100",
              ].join(" ")}
            >
              {isDone ? (
                <svg
                  className="w-3.5 h-3.5 text-white"
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
              ) : isActive ? (
                <svg
                  className="w-3 h-3 text-[#2E8B57] animate-spin"
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
              ) : (
                <span className="text-[10px] font-bold text-gray-400">
                  {idx + 1}
                </span>
              )}
            </div>
            <span
              className={[
                "text-xs font-medium transition-colors",
                isDone
                  ? "text-[#2E8B57]"
                  : isActive
                    ? "text-gray-800"
                    : "text-gray-400",
              ].join(" ")}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={[
                  "h-px flex-1 transition-colors duration-500",
                  isDone ? "bg-[#2E8B57]/40" : "bg-gray-200",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AssignDriverDialog({
  bookingId,
  onClose,
  onAssigned,
}: {
  bookingId: number;
  onClose: () => void;
  onAssigned: (driverName: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [step, setStep] = useState<AssignStep>("idle");
  const overlayRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery(driversQueryOptions);

  const mutation = useMutation({
    mutationFn: ({ driverId }: { driverId: number }) => {
      setStep("assigning");
      return new Promise<{ driverId: number }>((resolve, reject) => {
        setTimeout(() => setStep("notifying"), 600);
        assignDriverToHireBooking(bookingId, driverId)
          .then(() => resolve({ driverId }))
          .catch(reject);
      });
    },
    onSuccess: (_data, { driverId }) => {
      setStep("done");
      setSuccessId(driverId);
      queryClient.invalidateQueries({ queryKey: ["driver-bookings"] });
      queryClient.invalidateQueries({
        queryKey: ["driver-booking", bookingId],
      });

      const assigned = drivers.find((d) => d.id === driverId);
      const name = assigned
        ? `${assigned.driver_firstname} ${assigned.driver_lastname}`
        : "Driver";

      setTimeout(() => {
        onAssigned(name);
        onClose();
      }, 800);
    },
    onError: () => {
      setStep("idle");
      setAssigningId(null);
    },
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && step === "idle") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return drivers;
    return drivers.filter((d) => {
      const full = `${d.driver_firstname} ${d.driver_lastname}`.toLowerCase();
      return full.includes(q) || (d.driver_mobile ?? "").includes(q);
    });
  }, [drivers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / DIALOG_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * DIALOG_PAGE_SIZE,
    safePage * DIALOG_PAGE_SIZE,
  );

  function handleAssign(driver: Driver) {
    if (mutation.isPending) return;
    setAssigningId(driver.id);
    mutation.mutate({ driverId: driver.id });
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && step === "idle") onClose();
  }

  const isBusy = mutation.isPending;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(2px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Assign driver"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Assign Driver</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Booking #{bookingId} · select a driver to assign
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Close dialog"
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

        <StepProgress step={step} />

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-50 shrink-0">
          <div className="relative">
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
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              disabled={isBusy}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-50"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div className="mx-6 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 shrink-0">
            <svg
              className="w-4 h-4 text-red-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <span className="text-xs text-red-600 font-medium">
              {(mutation.error as Error).message}
            </span>
          </div>
        )}

        {/* Driver table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 bg-gray-50/90 backdrop-blur-sm">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <p className="text-sm text-gray-400">
                      No drivers match your search
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                paged.map((driver) => {
                  const fullName = `${driver.driver_firstname} ${driver.driver_lastname}`;
                  const isAssigning =
                    assigningId === driver.id && mutation.isPending;
                  const isSuccess = successId === driver.id;

                  return (
                    <tr
                      key={driver.id}
                      className={[
                        "transition-colors",
                        isSuccess ? "bg-emerald-50/60" : "hover:bg-gray-50/70",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={driver.profile_photo_file}
                            name={fullName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">
                              {fullName}
                            </p>
                            {driver.driver_mobile && (
                              <p className="text-xs text-gray-400 truncate">
                                {driver.driver_mobile}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={[
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            driver.is_available
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "w-1.5 h-1.5 rounded-full",
                              driver.is_available
                                ? "bg-emerald-500"
                                : "bg-gray-400",
                            ].join(" ")}
                          />
                          {driver.is_available ? "Available" : "Offline"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <svg
                              className="w-3.5 h-3.5"
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
                            Assigned
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAssign(driver)}
                            disabled={isBusy}
                            className={[
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              isAssigning
                                ? "bg-[#2E8B57] text-white opacity-80 cursor-wait"
                                : isBusy
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-[#2E8B57] text-white hover:bg-emerald-700 active:scale-95 shadow-sm",
                            ].join(" ")}
                          >
                            {isAssigning ? (
                              <>
                                <svg
                                  className="w-3 h-3 animate-spin"
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
                                {step === "notifying"
                                  ? "Notifying…"
                                  : "Assigning…"}
                              </>
                            ) : (
                              "Assign"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-gray-400">
              <span className="font-medium text-gray-600">
                {filtered.length}
              </span>{" "}
              driver{filtered.length !== 1 ? "s" : ""}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1 || isBusy}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      disabled={isBusy}
                      className={[
                        "min-w-7 h-7 px-2 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed",
                        p === safePage
                          ? "text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100",
                      ].join(" ")}
                      style={
                        p === safePage
                          ? { backgroundColor: "#2E8B57" }
                          : undefined
                      }
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages || isBusy}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function ViewHireDriverBooking() {
  const { bookingId } = Route.useParams();
  const [showAssign, setShowAssign] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery(driverBookingDetailQueryOptions(Number(bookingId)));

  const canAssign = booking?.booking_status?.toLowerCase() === "pending";

  if (isLoading) return <SkeletonDetail />;

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
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
        <p className="text-sm font-semibold text-red-500">
          Failed to load booking
        </p>
        <p className="text-xs text-gray-400">{(error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/hire-driver-bookings"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Back to hire driver bookings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Hire Driver Booking #{booking.id}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {formatDate(booking.date_of_hire)}
              {booking.time_of_hire ? ` · ${booking.time_of_hire}` : ""}
              {booking.hire_type ? ` · ${booking.hire_type}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={booking.booking_status} />
          {canAssign && (
            <button
              onClick={() => setShowAssign(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#2E8B57] hover:bg-emerald-700 active:scale-95 shadow-sm transition-all ml-2"
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
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
              Assign Driver
            </button>
          )}
        </div>
      </div>

      {/* Assign dialog */}
      {showAssign && (
        <AssignDriverDialog
          bookingId={booking.id}
          onClose={() => setShowAssign(false)}
          onAssigned={(driverName) => {
            setShowAssign(false);
            setToastMessage(`${driverName} assigned successfully`);
          }}
        />
      )}

      {toastMessage && (
        <AssignSuccessToast
          message={toastMessage}
          onDone={() => setToastMessage(null)}
        />
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — booking + comments */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Booking Details"
            icon={
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
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m0-3.75h.375a.375.375 0 01.375.375v.375m0-3.75h.375a.375.375 0 01.375.375v.375m-2.25 0h.375a.375.375 0 01.375.375v.375m0-3.75h.375a.375.375 0 01.375.375v.375"
                />
              </svg>
            }
          >
            <InfoRow label="Hire Type" value={booking.hire_type} />
            <InfoRow
              label="Date of Hire"
              value={formatDate(booking.date_of_hire)}
            />
            <InfoRow label="Time of Hire" value={booking.time_of_hire ?? "—"} />
            <InfoRow label="Cost" value={formatCost(booking.amount)} />
            <InfoRow
              label="Booking Status"
              value={<StatusBadge status={booking.booking_status} />}
            />
            <InfoRow label="Phone Number" value={booking.phonenumber} />
          </SectionCard>

          {booking.comments && (
            <SectionCard
              title="Comments"
              icon={
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
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
              }
            >
              <p className="py-4 text-sm text-gray-700 leading-relaxed">
                {booking.comments}
              </p>
            </SectionCard>
          )}
        </div>

        {/* Right — client + driver */}
        <div className="space-y-6">
          <SectionCard
            title="Client"
            icon={
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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            }
          >
            <div className="flex items-center gap-3 py-4 border-b border-gray-50">
              <Avatar
                src={booking.client_avatar}
                name={booking.client_name}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {booking.client_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {booking.phonenumber}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Driver"
            icon={
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
            }
          >
            {booking.driver_name ? (
              <>
                <div className="flex items-center gap-3 py-4 border-b border-gray-50">
                  <Avatar
                    src={booking.driver_photo}
                    name={booking.driver_name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {booking.driver_name}
                    </p>
                    {booking.driver_mobile && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {booking.driver_mobile}
                      </p>
                    )}
                  </div>
                </div>
                {booking.required_class && (
                  <InfoRow
                    label="Required Licence Class"
                    value={booking.required_class}
                  />
                )}
              </>
            ) : (
              <div className="py-5 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-400">No driver assigned</p>
                {canAssign && (
                  <button
                    onClick={() => setShowAssign(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2E8B57] ring-1 ring-[#2E8B57]/30 hover:bg-emerald-50 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
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
                    Assign a driver
                  </button>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
