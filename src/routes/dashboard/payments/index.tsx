import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  paymentsQueryOptions,
  type Payment,
} from "#/utils/queries/paymentQueries";

export const Route = createFileRoute("/dashboard/payments/")({
  component: Payments,
});

const PAGE_SIZE = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatAmount(val: number | null, currency: string | null): string {
  if (val == null) return "—";
  const sym = currency === "USD" || !currency ? "$" : `${currency} `;
  return `${sym}${val.toFixed(2)}`;
}

function formatDate(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ClientAvatar({
  src,
  name,
  size = "sm",
}: {
  src: string | null;
  name: string;
  size?: "sm" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dim = size === "lg" ? "w-16 h-16" : "w-9 h-9";
  const text = size === "lg" ? "text-lg" : "text-xs";

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
      <span className={`${text} font-semibold text-white`}>{initials}</span>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    failed: "bg-red-50 text-red-600 ring-red-200",
    refunded: "bg-purple-50 text-purple-700 ring-purple-200",
    cancelled: "bg-gray-50 text-gray-500 ring-gray-200",
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

function PaymentTypeBadge({ label }: { label: string }) {
  const colours: Record<string, string> = {
    "Cab Payment": "bg-blue-50 text-blue-700 ring-blue-200",
    "Shuttle Payment": "bg-violet-50 text-violet-700 ring-violet-200",
    "Car Rental Payment": "bg-orange-50 text-orange-700 ring-orange-200",
    "Hire Driver Payment": "bg-teal-50 text-teal-700 ring-teal-200",
  };
  const cls = colours[label] ?? "bg-gray-50 text-gray-600 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${cls}`}
    >
      {label}
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

// ── Detail Panel ───────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
  stacked = false,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <div className="py-3.5 border-b border-gray-100 last:border-0">
        <div className="flex items-center gap-2.5 text-gray-400 mb-1.5">
          {icon}
          <span className="text-sm text-gray-500">{label}</span>
        </div>
        <div className="text-xs font-semibold text-gray-900 pl-6.5 break-all">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2.5 text-gray-400 shrink-0">
        {icon}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-sm font-semibold text-gray-900 text-right">
        {children}
      </div>
    </div>
  );
}

function PaymentDetailPanel({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-gray-50 shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Payment Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Client card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <ClientAvatar
              src={payment.client_avatar}
              name={payment.client_name}
              size="lg"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {payment.client_name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Client</p>
              {payment.client_phone && (
                <p className="text-xs text-gray-500 mt-1">
                  {payment.client_phone}
                </p>
              )}
            </div>
          </div>

          {/* Payment information */}
          <div className="bg-white rounded-xl border border-gray-100 px-4">
            <p className="text-sm font-semibold text-gray-900 py-3.5 border-b border-gray-100">
              Payment Information
            </p>

            <DetailRow
              label="Reference Number:"
              stacked
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
              }
            >
              <span className="font-mono">
                {payment.paynow_reference ?? "—"}
              </span>
            </DetailRow>

            <DetailRow
              label="Payment Date:"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
              }
            >
              {formatDate(payment.created_at)}
            </DetailRow>

            <DetailRow
              label="Payment Type:"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
              }
            >
              <PaymentTypeBadge label={payment.payable_type_label} />
            </DetailRow>

            <DetailRow
              label="Status:"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              <PaymentStatusBadge status={payment.status} />
            </DetailRow>

            <DetailRow
              label="Amount Invoiced:"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              {formatAmount(payment.amount_invoiced, payment.currency)}
            </DetailRow>

            <DetailRow
              label="Amount Paid:"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                  />
                </svg>
              }
            >
              {formatAmount(payment.amount_paid, payment.currency)}
            </DetailRow>

            <DetailRow
              label="Payment Method:"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
              }
            >
              {payment.payment_method ?? "—"}
            </DetailRow>

            {payment.payment_method_reference && (
              <DetailRow
                label="Method Reference:"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.6}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                    />
                  </svg>
                }
              >
                <span className="font-mono text-xs">
                  {payment.payment_method_reference}
                </span>
              </DetailRow>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function Payments() {
  const {
    data: payments = [],
    isLoading,
    error,
  } = useQuery(paymentsQueryOptions);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  function resetPage() {
    setPage(1);
  }

  const statusOptions = useMemo(() => {
    const set = new Set(payments.map((p) => p.status).filter(Boolean));
    return Array.from(set) as string[];
  }, [payments]);

  const typeOptions = useMemo(() => {
    const set = new Set(
      payments.map((p) => p.payable_type_label).filter(Boolean),
    );
    return Array.from(set) as string[];
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return payments.filter((p) => {
      if (q) {
        const name = p.client_name.toLowerCase();
        const ref = (p.paynow_reference ?? "").toLowerCase();
        if (!name.includes(q) && !ref.includes(q)) return false;
      }
      if (filterStatus !== "all") {
        if (p.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
      }
      if (filterType !== "all") {
        if (p.payable_type_label !== filterType) return false;
      }
      return true;
    });
  }, [payments, search, filterStatus, filterType]);

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
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {isLoading
            ? "Loading…"
            : `${payments.length} payment${payments.length !== 1 ? "s" : ""} total`}
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
              placeholder="Search by client or reference…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Payment type filter */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                resetPage();
              }}
              className="text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition cursor-pointer"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            >
              <option value="all">All payment types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Status filter */}
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
                  "Client",
                  "Payment Type",
                  "Date",
                  "Reference Number",
                  "Status",
                  "Amount Paid",
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
              {/* Skeleton */}
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {/* Error */}
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
                        Failed to load payments
                      </p>
                      <p className="text-xs text-gray-400">
                        {(error as Error).message}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}
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
                          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-400">
                        No payments found
                      </p>
                      {(search ||
                        filterStatus !== "all" ||
                        filterType !== "all") && (
                        <p className="text-xs text-gray-400">
                          Try adjusting your search or filters
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!isLoading &&
                !error &&
                paged.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    onView={() => setSelectedPayment(payment)}
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
              payments
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

      {/* Detail panel */}
      {selectedPayment && (
        <PaymentDetailPanel
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}

// ── Payment Row ────────────────────────────────────────────────────────────────

function PaymentRow({
  payment,
  onView,
}: {
  payment: Payment;
  onView: () => void;
}) {
  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      {/* Client */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <ClientAvatar
            src={payment.client_avatar}
            name={payment.client_name}
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {payment.client_name}
            </p>
            {payment.client_phone && (
              <p className="text-xs text-gray-400 truncate">
                {payment.client_phone}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Payment Type */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <PaymentTypeBadge label={payment.payable_type_label} />
      </td>

      {/* Date */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-gray-600">{formatDate(payment.created_at)}</span>
      </td>

      {/* Reference Number */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="font-mono text-gray-700 text-xs">
          {payment.paynow_reference ?? "—"}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <PaymentStatusBadge status={payment.status} />
      </td>

      {/* Amount Paid */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="font-semibold text-gray-900">
          {formatAmount(payment.amount_paid, payment.currency)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <button
          onClick={onView}
          title="View payment"
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
        </button>
      </td>
    </tr>
  );
}
