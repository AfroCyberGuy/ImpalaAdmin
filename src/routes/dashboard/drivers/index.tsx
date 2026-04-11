import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

const PAGE_SIZE = 10;
import {
  driversQueryOptions,
  type Driver,
} from "#/utils/queries/driverQueries";

export const Route = createFileRoute("/dashboard/drivers/")({
  component: ViewDrivers,
});

// ── Star Rating ────────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-gray-400">No ratings</span>;
  }
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < full;
          const isHalf = !filled && i === full && half;
          return (
            <svg
              key={i}
              className={[
                "w-3.5 h-3.5",
                filled
                  ? "text-amber-400"
                  : isHalf
                    ? "text-amber-300"
                    : "text-gray-200",
              ].join(" ")}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>
      <span className="text-xs font-medium text-gray-600">{value}</span>
    </div>
  );
}

// ── Availability Badge ─────────────────────────────────────────────────────────

function AvailabilityBadge({ available }: { available: boolean }) {
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

// ── Avatar ─────────────────────────────────────────────────────────────────────

function DriverAvatar({ src, name }: { src: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-2 ring-white shadow-sm">
      <span className="text-xs font-semibold text-white">{initials}</span>
    </div>
  );
}

// ── Action Menu ────────────────────────────────────────────────────────────────

function ActionButtons({ driver }: { driver: Driver }) {
  return (
    <div className="flex items-center gap-1">
      {/* View */}
      <Link
        to="/dashboard/drivers/$driverId"
        params={{ driverId: String(driver.id) }}
        title="View driver"
        className="p-1.5 rounded-lg text-gray-400 hover:text-[#2E8B57] hover:bg-emerald-50 transition-colors"
      >
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
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </Link>
    </div>
  );
}

// ── Skeleton Row ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[...Array(7)].map((_, i) => (
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

function ViewDrivers() {
  const {
    data: drivers = [],
    isLoading,
    error,
  } = useQuery(driversQueryOptions);
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [page, setPage] = useState(1);

  function resetPage() {
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return drivers.filter((d) => {
      if (q) {
        const full = `${d.driver_firstname} ${d.driver_lastname}`.toLowerCase();
        const code = d.code?.toLowerCase() ?? "";
        const email = d.driver_email?.toLowerCase() ?? "";
        if (!full.includes(q) && !code.includes(q) && !email.includes(q))
          return false;
      }
      if (filterGender !== "all") {
        if ((d.gender ?? "").toLowerCase() !== filterGender) return false;
      }
      if (filterAvailability !== "all") {
        const want = filterAvailability === "available";
        if (d.is_available !== want) return false;
      }
      return true;
    });
  }, [drivers, search, filterGender, filterAvailability]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const genderOptions = useMemo(() => {
    const set = new Set(
      drivers.map((d) => d.gender?.toLowerCase()).filter(Boolean),
    );
    return Array.from(set) as string[];
  }, [drivers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isLoading
              ? "Loading…"
              : `${drivers.length} registered driver${drivers.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          to="/dashboard/drivers/register"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
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
          Register Driver
        </Link>
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
              placeholder="Search by name, code or email…"
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
            {/* Gender filter */}
            <select
              value={filterGender}
              onChange={(e) => {
                setFilterGender(e.target.value);
                resetPage();
              }}
              className="text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition cursor-pointer"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            >
              <option value="all">All genders</option>
              {genderOptions.map((g) => (
                <option key={g} value={g} className="capitalize">
                  {g}
                </option>
              ))}
            </select>

            {/* Availability filter */}
            <select
              value={filterAvailability}
              onChange={(e) => {
                setFilterAvailability(e.target.value);
                resetPage();
              }}
              className="text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition cursor-pointer"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            >
              <option value="all">All availability</option>
              <option value="available">Available</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Licence Class
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Availability
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
                        Failed to load drivers
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
                          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-400">
                        No drivers found
                      </p>
                      {(search ||
                        filterGender !== "all" ||
                        filterAvailability !== "all") && (
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
                paged.map((driver) => (
                  <tr
                    key={driver.id}
                    className="hover:bg-gray-50/70 transition-colors group"
                  >
                    {/* Driver */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <DriverAvatar
                          src={driver.profile_photo_file}
                          name={`${driver.driver_firstname} ${driver.driver_lastname}`}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {driver.driver_firstname} {driver.driver_lastname}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {driver.driver_email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-mono font-medium">
                        {driver.code ?? "—"}
                      </span>
                    </td>

                    {/* Licence Class */}
                    <td className="px-5 py-3.5">
                      {driver.licence_class ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                          {driver.licence_class}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Gender */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-600 capitalize">
                        {driver.gender ?? "—"}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-3.5">
                      <StarRating value={driver.avg_rating} />
                    </td>

                    {/* Availability */}
                    <td className="px-5 py-3.5">
                      <AvailabilityBadge available={driver.is_available} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <ActionButtons driver={driver} />
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
              drivers
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
    </div>
  );
}
