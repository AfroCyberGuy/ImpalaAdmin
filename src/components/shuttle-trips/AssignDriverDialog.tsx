import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  driversQueryOptions,
  type Driver,
} from "#/utils/queries/driverQueries";
import { assignDriverToShuttleTrip } from "#/utils/queries/shuttleTripQueries";

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ── Types ──────────────────────────────────────────────────────────────────────

interface AssignDriverDialogProps {
  tripId: number;
  onClose: () => void;
  onAssigned: (driverName: string) => void;
}

type AssignStep = "idle" | "assigning" | "notifying" | "done";

// ── Toast ──────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function AssignSuccessToast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 right-6 z-60 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gray-900 text-white shadow-2xl animate-[fadeSlideUp_250ms_ease-out]"
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function DriverAvatar({ src, name }: { src: string | null; name: string }) {
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

function AvailabilityDot({ available }: { available: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        available
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
      ].join(" ")}
    >
      <span
        className={[
          "w-1.5 h-1.5 rounded-full",
          available ? "bg-emerald-500" : "bg-gray-400",
        ].join(" ")}
      />
      {available ? "Available" : "Offline"}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
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
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────

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

// ── Dialog ─────────────────────────────────────────────────────────────────────

export function AssignDriverDialog({
  tripId,
  onClose,
  onAssigned,
}: AssignDriverDialogProps) {
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
        assignDriverToShuttleTrip(tripId, driverId)
          .then(() => resolve({ driverId }))
          .catch(reject);
      });
    },
    onSuccess: (_data, { driverId }) => {
      setStep("done");
      setSuccessId(driverId);
      queryClient.invalidateQueries({ queryKey: ["shuttle-trips"] });
      queryClient.invalidateQueries({ queryKey: ["shuttle-trip", tripId] });

      const assignedDriver = drivers.find((d) => d.id === driverId);
      const name = assignedDriver
        ? `${assignedDriver.driver_firstname} ${assignedDriver.driver_lastname}`
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
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
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-[fadeSlideUp_200ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Assign Driver</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Shuttle trip #{tripId} · select a driver to assign
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

        {/* Error banner */}
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

        {/* Table */}
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
                  <SkeletonRow key={i} />
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
                  const isDisabled = isBusy;

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
                          <DriverAvatar
                            src={driver.profile_photo_file}
                            name={fullName}
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
                        <AvailabilityDot available={driver.is_available} />
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
                            disabled={isDisabled}
                            className={[
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              isAssigning
                                ? "bg-[#2E8B57] text-white opacity-80 cursor-wait"
                                : isDisabled
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

        {/* Footer — pagination */}
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

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 5) return true;
                    if (p === 1 || p === totalPages) return true;
                    return Math.abs(p - safePage) <= 1;
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
                  }, [])
                  .map((item, idx) =>
                    item === "…" ? (
                      <span
                        key={`e-${idx}`}
                        className="px-1 text-xs text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        disabled={isBusy}
                        className={[
                          "min-w-7 h-7 px-2 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed",
                          item === safePage
                            ? "text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100",
                        ].join(" ")}
                        style={
                          item === safePage
                            ? { backgroundColor: "#2E8B57" }
                            : undefined
                        }
                      >
                        {item}
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
