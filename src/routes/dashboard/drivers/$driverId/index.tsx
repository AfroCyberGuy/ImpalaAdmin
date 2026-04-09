import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { driverDetailQueryOptions } from "#/utils/queries/driverQueries";
import { DriverHeroCard } from "#/components/drivers/DriverHeroCard";
import { DriverProfileTab } from "#/components/drivers/DriverProfileTab";
import { DriverBankingPanel } from "#/components/drivers/DriverBankingPanel";

export const Route = createFileRoute("/dashboard/drivers/$driverId/")({
  component: ViewDriver,
});

// ── Tab Button ─────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150",
        active
          ? "bg-white text-[#2E8B57] shadow-sm ring-1 ring-gray-100"
          : "text-gray-500 hover:text-gray-700 hover:bg-white/60",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonHero() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-1.5 bg-gray-100" />
      <div className="px-6 py-6 flex items-start gap-6">
        <div className="w-24 h-24 rounded-2xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-5 bg-gray-100 rounded-lg w-48" />
          <div className="h-3.5 bg-gray-100 rounded-lg w-32" />
          <div className="h-3 bg-gray-100 rounded-lg w-24" />
        </div>
        <div className="hidden sm:flex gap-6 py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-7 w-10 bg-gray-100 rounded-lg" />
              <div className="h-3 w-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonContent() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-4 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-64" />
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-64" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function ViewDriver() {
  const { driverId } = Route.useParams();
  const id = Number(driverId);
  const [tab, setTab] = useState<"profile" | "banking">("profile");

  const {
    data: driver,
    isLoading,
    error,
  } = useQuery(driverDetailQueryOptions(id));

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link
          to="/dashboard/drivers"
          className="hover:text-[#2E8B57] transition-colors font-medium"
        >
          Drivers
        </Link>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <span className="text-gray-600 font-medium">
          {driver
            ? `${driver.driver_firstname} ${driver.driver_lastname}`
            : "Driver Profile"}
        </span>
      </nav>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-6 py-10 text-center">
          <svg
            className="w-10 h-10 text-red-300 mx-auto mb-3"
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
          <p className="text-sm font-semibold text-red-500 mb-1">
            Failed to load driver
          </p>
          <p className="text-xs text-red-400">{(error as Error).message}</p>
          <Link
            to="/dashboard/drivers"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E8B57] hover:underline"
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to drivers
          </Link>
        </div>
      )}

      {/* Hero card */}
      {isLoading && <SkeletonHero />}
      {driver && <DriverHeroCard driver={driver} />}

      {/* Tab bar */}
      {(isLoading || driver) && (
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl w-fit">
          <TabButton
            active={tab === "profile"}
            onClick={() => setTab("profile")}
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
            Profile
          </TabButton>
          <TabButton
            active={tab === "banking"}
            onClick={() => setTab("banking")}
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
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            }
          >
            Banking Details
          </TabButton>
        </div>
      )}

      {/* Tab content */}
      {isLoading && <SkeletonContent />}
      {driver && tab === "profile" && <DriverProfileTab driver={driver} />}
      {driver && tab === "banking" && <DriverBankingPanel driver={driver} />}
    </div>
  );
}
