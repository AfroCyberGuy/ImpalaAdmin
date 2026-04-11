import { useState } from "react";
import type { DriverDetail } from "#/utils/queries/driverQueries";

// ── Stat Pill ──────────────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[64px]">
      <span className="text-2xl font-bold text-gray-900 leading-none tabular-nums">
        {value}
      </span>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ src, name }: { src: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);

  const initials =
    name
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg shrink-0"
      />
    );
  }

  return (
    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-4 ring-white shadow-lg shrink-0">
      <span className="text-2xl font-bold text-white">{initials}</span>
    </div>
  );
}

// ── Availability Badge ─────────────────────────────────────────────────────────

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        available
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
      ].join(" ")}
    >
      <span
        className={[
          "w-1.5 h-1.5 rounded-full",
          available ? "bg-emerald-500 animate-pulse" : "bg-gray-400",
        ].join(" ")}
      />
      {available ? "Available" : "Offline"}
    </span>
  );
}

// ── Contact Row ────────────────────────────────────────────────────────────────

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-gray-600">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DriverHeroCard({
  driver,
  tripCount = 0,
  accidentCount = 0,
}: {
  driver: DriverDetail;
  tripCount?: number;
  accidentCount?: number;
}) {
  const fullName = `${driver.driver_firstname} ${driver.driver_lastname}`;
  const reviewCount = driver.avg_rating !== null ? 1 : 0;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#2E8B57] via-emerald-400 to-teal-400" />

      <div className="px-6 py-6 flex flex-col sm:flex-row items-start gap-6">
        {/* Avatar + name block */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar src={driver.profile_photo_file} name={fullName} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {fullName}
              </h1>
              <AvailabilityBadge available={driver.is_available} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
              {driver.licence_class && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 text-xs font-semibold">
                  {driver.licence_class}
                </span>
              )}
              {driver.code && (
                <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                  #{driver.code}
                </span>
              )}
              {driver.gender && (
                <span className="text-xs capitalize text-gray-400">
                  {driver.gender}
                </span>
              )}
            </div>

            {/* Star rating */}
            {driver.avg_rating !== null && (
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => {
                    const filled = i < Math.floor(driver.avg_rating!);
                    const isHalf =
                      !filled &&
                      i === Math.floor(driver.avg_rating!) &&
                      driver.avg_rating! - Math.floor(driver.avg_rating!) >=
                        0.5;
                    return (
                      <svg
                        key={i}
                        className={[
                          "w-4 h-4",
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
                <span className="text-sm font-semibold text-gray-700">
                  {driver.avg_rating}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px self-stretch bg-gray-100" />

        {/* Contact details */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Contact Details
          </p>
          {driver.driver_email && (
            <ContactRow
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
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              }
            >
              {driver.driver_email}
            </ContactRow>
          )}
          <ContactRow
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
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
            }
          >
            {driver.driver_mobile}
          </ContactRow>
          {driver.physical_address && (
            <ContactRow
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
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              }
            >
              {driver.physical_address}
            </ContactRow>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px self-stretch bg-gray-100" />

        {/* Stats */}
        <div className="flex sm:flex-col items-center justify-center gap-6 sm:gap-4 py-1 sm:px-2">
          <StatPill value={tripCount} label="Trips" />
          <div className="w-px h-8 sm:h-px sm:w-full bg-gray-100" />
          <StatPill value={accidentCount} label="Accident(s)" />
          <div className="w-px h-8 sm:h-px sm:w-full bg-gray-100" />
          <StatPill value={reviewCount} label="Reviews" />
        </div>
      </div>
    </div>
  );
}
