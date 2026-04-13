import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  accidentReportsQueryOptions,
  accidentStatusesQueryOptions,
  accidentTypesQueryOptions,
  type AccidentReport,
} from "#/utils/queries/accidentReportQueries";
import CreateReportSheet from "#/components/accident_reports/CreateReportSheet";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/dashboard/accident_reports/")({
  component: ViewAccidentReports,
});

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "bg-gray-50 text-gray-500 ring-1 ring-gray-200";
  let dot = "bg-gray-400";

  if (s.includes("open") || s.includes("filed") || s.includes("pending")) {
    cls = "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    dot = "bg-amber-500";
  } else if (s.includes("closed") || s.includes("resolved")) {
    cls = "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    dot = "bg-emerald-500";
  } else if (s.includes("reject") || s.includes("dismiss")) {
    cls = "bg-red-50 text-red-700 ring-1 ring-red-200";
    dot = "bg-red-500";
  } else if (s.includes("review") || s.includes("investigat")) {
    cls = "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    dot = "bg-blue-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

// ── Type Badge ─────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200">
      {type}
    </span>
  );
}

// ── Skeleton Row ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-4 bg-gray-100 rounded-md animate-pulse"
            style={{ width: `${60 + ((i * 13) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function ViewAccidentReports() {
  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery(accidentReportsQueryOptions);

  const { data: statusOptions = [] } = useQuery(accidentStatusesQueryOptions);
  const { data: typeOptions = [] } = useQuery(accidentTypesQueryOptions);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);

  function resetPage() {
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return reports.filter((r) => {
      if (q) {
        const driver = r.driver_name.toLowerCase();
        const type = r.accident_type.toLowerCase();
        const status = r.accident_status.toLowerCase();
        const details = r.details?.toLowerCase() ?? "";
        if (
          !driver.includes(q) &&
          !type.includes(q) &&
          !status.includes(q) &&
          !details.includes(q)
        )
          return false;
      }
      if (filterStatus !== "all" && r.accident_status !== filterStatus)
        return false;
      if (filterType !== "all" && r.accident_type !== filterType) return false;
      return true;
    });
  }, [reports, search, filterStatus, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accident Reports</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {isLoading
            ? "Loading…"
            : `${reports.length} report${reports.length !== 1 ? "s" : ""} filed`}
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
              placeholder="Search by driver, type, status…"
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
                <option key={s.id} value={s.status}>
                  {s.status}
                </option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                resetPage();
              }}
              className="text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition cursor-pointer"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            >
              <option value="all">All types</option>
              {typeOptions.map((t) => (
                <option key={t.id} value={t.type}>
                  {t.type}
                </option>
              ))}
            </select>

            {/* Create Report */}
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 active:opacity-80 transition-opacity ml-auto"
              style={{ backgroundColor: "#2E8B57" }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create Report
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Accident Date
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!isLoading && error && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
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
                        Failed to load accident reports
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
                  <td colSpan={7} className="px-5 py-16 text-center">
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
                          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-400">
                        No accident reports found
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

              {!isLoading &&
                !error &&
                paged.map((report: AccidentReport) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-mono font-medium">
                        #{report.id}
                      </span>
                    </td>

                    {/* Driver */}
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-900">
                        {report.driver_name}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <TypeBadge type={report.accident_type} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={report.accident_status} />
                    </td>

                    {/* Accident Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-600">
                        {formatDate(report.accident_date)}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-5 py-3.5 max-w-xs">
                      {report.details ? (
                        <p
                          className="text-sm text-gray-600 truncate"
                          title={report.details}
                        >
                          {report.details}
                        </p>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <Link
                          to="/dashboard/accident_reports/$reportId"
                          params={{ reportId: String(report.id) }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2E8B57] border border-[#2E8B57]/30 bg-white hover:bg-[#2E8B57] hover:text-white transition-colors"
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
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          View Report
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Count summary */}
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
              reports
            </p>

            {/* Page controls */}
            <div className="flex items-center gap-1 order-1 sm:order-2">
              {/* Previous */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
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

              {/* Page number pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - safePage) <= 1) return true;
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
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-xs text-gray-400 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={[
                        "min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors",
                        item === safePage
                          ? "text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100",
                      ].join(" ")}
                      style={
                        item === safePage
                          ? { backgroundColor: "#2E8B57" }
                          : undefined
                      }
                      aria-current={item === safePage ? "page" : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
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
          </div>
        )}
      </div>

      <CreateReportSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
