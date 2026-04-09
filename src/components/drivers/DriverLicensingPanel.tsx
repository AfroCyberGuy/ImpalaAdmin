import type {
  DriverDetail,
  DriverTraining,
} from "#/utils/queries/driverQueries";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#2E8B57] to-emerald-400" />
      <h3 className="text-sm font-bold text-gray-800">{children}</h3>
    </div>
  );
}

// ── Detail Row ─────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-700">{value || "—"}</span>
    </div>
  );
}

// ── Training Badge ─────────────────────────────────────────────────────────────

function TrainingBadge({ training }: { training: DriverTraining }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded-full bg-[#2E8B57] flex items-center justify-center shrink-0">
          <svg
            className="w-3 h-3 text-white"
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
        </div>
        <span className="text-xs font-medium text-gray-700 truncate">
          {training.training_type}
        </span>
      </div>
      <span className="text-xs text-gray-400 shrink-0">
        {formatDate(training.training_date)}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DriverLicensingPanel({
  driver,
  onEdit,
}: {
  driver: DriverDetail;
  onEdit?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gray-800 flex-1">
            Licensing &amp; Clearance
          </h2>
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
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
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Licence Details */}
        <div>
          <SectionHeading>Licence Details</SectionHeading>
          <div className="grid grid-cols-1 gap-3">
            <DetailRow
              label="Drivers Licence Number"
              value={driver.licence_number}
            />
            <DetailRow
              label="Licence Date Issued"
              value={formatDate(driver.licence_issue_date)}
            />
            <DetailRow label="Licence Class" value={driver.licence_class} />
            {driver.driving_experience !== null && (
              <DetailRow
                label="Driving Experience"
                value={`${driver.driving_experience} year${driver.driving_experience !== 1 ? "s" : ""}`}
              />
            )}
            <DetailRow
              label="Defensive Driving Expiry"
              value={formatDate(driver.defensive_licence_expiry)}
            />
          </div>
        </div>

        {/* Medicals */}
        <div>
          <SectionHeading>Medicals</SectionHeading>
          <div className="grid grid-cols-1 gap-3">
            <DetailRow
              label="Medical Test Issue Date"
              value={formatDate(driver.medical_test_issue_date)}
            />
          </div>
        </div>

        {/* Clearance */}
        <div>
          <SectionHeading>Clearance</SectionHeading>
          <div className="grid grid-cols-1 gap-3">
            <DetailRow
              label="Police Clearance Issued Date"
              value={formatDate(driver.police_clearance_issue_date)}
            />
            {driver.impala_certificate_issue_date && (
              <DetailRow
                label="Impala Certificate Issue Date"
                value={formatDate(driver.impala_certificate_issue_date)}
              />
            )}
          </div>
        </div>

        {/* Training */}
        {driver.trainings.length > 0 && (
          <div>
            <SectionHeading>Impala Trainings</SectionHeading>
            <div className="space-y-2">
              {driver.trainings.map((t, i) => (
                <TrainingBadge key={i} training={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
