import { useState } from "react";
import type { DriverDetail } from "#/utils/queries/driverQueries";
import { DriverDocuments, type DocumentEntry } from "./DriverDocuments";
import { DriverLicensingPanel } from "./DriverLicensingPanel";
import { EditPersonalForm } from "./edit/EditPersonalForm";
import { EditNextOfKinForm } from "./edit/EditNextOfKinForm";
import { EditLicensingForm } from "./edit/EditLicensingForm";

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

// ── Edit button ────────────────────────────────────────────────────────────────

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2E8B57] bg-emerald-50 hover:bg-emerald-100 transition-colors"
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
  );
}

// ── Info Card ──────────────────────────────────────────────────────────────────

function InfoCard({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-sm font-bold text-gray-800 flex-1">{title}</h2>
        {onEdit && <EditButton onClick={onEdit} />}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DetailField({
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

// ── Main Component ─────────────────────────────────────────────────────────────

type EditSection = "personal" | "nextOfKin" | "licensing" | null;

export function DriverProfileTab({ driver }: { driver: DriverDetail }) {
  const [editing, setEditing] = useState<EditSection>(null);

  const documents: DocumentEntry[] = [
    { label: "National ID", url: driver.national_id_file },
    { label: "Passport", url: driver.passport_file },
    { label: "Drivers Licence", url: driver.drivers_licence_file },
    { label: "Defensive Drivers Licence", url: driver.defensive_licence_file },
    {
      label: "International Drivers Licence",
      url: driver.international_licence_file,
    },
    {
      label: "First Aid Medical Certificate",
      url: driver.first_aid_certificate_file,
    },
    { label: "Medical Test", url: driver.medical_test_file },
    { label: "Police Clearance", url: driver.police_clearance_file },
    { label: "Proof of Residence", url: driver.proof_of_residence_file },
  ];

  return (
    <>
      <div className="space-y-5">
        {/* Personal Details */}
        <InfoCard
          title="Personal Details"
          onEdit={() => setEditing("personal")}
          icon={
            <svg
              className="w-4 h-4 text-gray-500"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailField
              label="Date of Birth"
              value={formatDate(driver.date_of_birth)}
            />
            <DetailField label="Gender" value={driver.gender} />
            <DetailField
              label="National ID Number"
              value={driver.national_id_number}
            />
            <DetailField
              label="Passport Number"
              value={driver.passport_number}
            />
            <DetailField label="Mobile Number" value={driver.driver_mobile} />
            <DetailField label="Email" value={driver.driver_email} />
            <div className="sm:col-span-2 lg:col-span-3">
              <DetailField
                label="Physical Address"
                value={driver.physical_address}
              />
            </div>
          </div>
        </InfoCard>

        {/* Next of Kin */}
        <InfoCard
          title="Next of Kin"
          onEdit={() => setEditing("nextOfKin")}
          icon={
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DetailField label="Full Name" value={driver.kin_full_name} />
            <DetailField
              label="Mobile Number"
              value={driver.kin_mobile_number}
            />
            <DetailField
              label="Physical Address"
              value={driver.kin_physical_address}
            />
          </div>
        </InfoCard>

        {/* Documents + Licensing side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DriverDocuments documents={documents} />
          <DriverLicensingPanel
            driver={driver}
            onEdit={() => setEditing("licensing")}
          />
        </div>
      </div>

      {/* Edit drawers */}
      <EditPersonalForm
        driver={driver}
        isOpen={editing === "personal"}
        onClose={() => setEditing(null)}
      />
      <EditNextOfKinForm
        driver={driver}
        isOpen={editing === "nextOfKin"}
        onClose={() => setEditing(null)}
      />
      <EditLicensingForm
        driver={driver}
        isOpen={editing === "licensing"}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
