import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { CarFront, Gauge, Search } from "lucide-react";
import {
  carListingsQueryOptions,
  type CarListingSummary,
} from "#/utils/queries/carListingQueries";

export const Route = createFileRoute("/dashboard/out_sourcing_details/")({
  component: OutSourcingDetails,
});

const PAGE_SIZE = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(val: string | null): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMileage(val: number | null): string {
  if (val == null) return "—";
  return `${val.toLocaleString()} km`;
}

function titleCase(val: string | null): string {
  if (!val) return "—";
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
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

function VehicleThumb({ src }: { src: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt="Vehicle"
        className="w-12 h-9 rounded-lg object-cover ring-1 ring-gray-100 shrink-0 bg-gray-50"
      />
    );
  }
  return (
    <div className="w-12 h-9 rounded-lg bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center shrink-0">
      <CarFront className="w-4 h-4 text-gray-300" />
    </div>
  );
}

function AvailabilityBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>;

  const s = status.toLowerCase();
  const styles: Record<string, string> = {
    fulltime: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "on request": "bg-amber-50 text-amber-700 ring-amber-200",
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

// ── Main Component ─────────────────────────────────────────────────────────────

function OutSourcingDetails() {
  const {
    data: listings = [],
    isLoading,
    error,
  } = useQuery(carListingsQueryOptions);

  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [page, setPage] = useState(1);

  function resetPage() {
    setPage(1);
  }

  const availabilityOptions = useMemo(() => {
    const set = new Set(listings.map((l) => l.availability).filter(Boolean));
    return Array.from(set) as string[];
  }, [listings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return listings.filter((l) => {
      if (q) {
        const name = l.client_name.toLowerCase();
        const phone = (l.client_phonenumber ?? "").toLowerCase();
        const model = l.vehicle_model.toLowerCase();
        if (!name.includes(q) && !phone.includes(q) && !model.includes(q))
          return false;
      }
      if (filterAvailability !== "all") {
        if (
          (l.availability ?? "").toLowerCase() !==
          filterAvailability.toLowerCase()
        )
          return false;
      }
      return true;
    });
  }, [listings, search, filterAvailability]);

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
        <h1 className="text-2xl font-bold text-gray-900">Car Out Sourcing</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {isLoading
            ? "Loading…"
            : `${listings.length} car${listings.length !== 1 ? "s" : ""} submitted for outsourcing`}
        </p>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
          {/* Search */}
          <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by client, phone or vehicle…"
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
              value={filterAvailability}
              onChange={(e) => {
                setFilterAvailability(e.target.value);
                resetPage();
              }}
              className="text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition cursor-pointer"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            >
              <option value="all">All availability</option>
              {availabilityOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
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
                  "Vehicle",
                  "Mileage",
                  "Condition",
                  "Fuel / Transmission",
                  "Availability",
                  "Submitted",
                  "Actions",
                ].map((col, i) => (
                  <th
                    key={col}
                    className={[
                      "px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap",
                      i === 7 ? "text-right" : "text-left",
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
                  <td
                    colSpan={COL_COUNT + 1}
                    className="px-5 py-16 text-center"
                  >
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
                        Failed to load car listings
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
                  <td
                    colSpan={COL_COUNT + 1}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CarFront className="w-8 h-8 text-gray-200" />
                      <p className="text-sm font-medium text-gray-400">
                        No car listings found
                      </p>
                      {(search || filterAvailability !== "all") && (
                        <p className="text-xs text-gray-400">
                          Try adjusting your search or filters
                        </p>
                      )}
                      {!search && filterAvailability === "all" && (
                        <p className="text-xs text-gray-400">
                          Cars submitted for outsourcing will appear here.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                paged.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
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
              listings
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
    </div>
  );
}

// ── Listing Row ────────────────────────────────────────────────────────────────

function ListingRow({ listing }: { listing: CarListingSummary }) {
  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      {/* Client */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <ClientAvatar
            src={listing.client_avatar}
            name={listing.client_name}
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {listing.client_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              Phone: {listing.client_phonenumber ?? "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Vehicle */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <VehicleThumb src={listing.cover_image} />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {listing.vehicle_model}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {listing.year ?? "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Mileage */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 text-gray-700">
          <Gauge className="w-3.5 h-3.5 text-gray-300" />
          {formatMileage(listing.mileage)}
        </span>
      </td>

      {/* Condition */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-gray-600">{titleCase(listing.condition)}</span>
      </td>

      {/* Fuel / Transmission */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <div className="flex flex-wrap items-center gap-1.5">
          {listing.fuel_type && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 ring-1 ring-sky-200">
              {titleCase(listing.fuel_type)}
            </span>
          )}
          {listing.transmission && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-violet-200">
              {titleCase(listing.transmission)}
            </span>
          )}
          {!listing.fuel_type && !listing.transmission && (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      </td>

      {/* Availability */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <AvailabilityBadge status={listing.availability} />
      </td>

      {/* Submitted */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-gray-600">{formatDate(listing.created_at)}</span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1">
          <Link
            to="/dashboard/view_out_sourced_cars/$listingId"
            params={{ listingId: String(listing.id) }}
            title="View listing"
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
        </div>
      </td>
    </tr>
  );
}
