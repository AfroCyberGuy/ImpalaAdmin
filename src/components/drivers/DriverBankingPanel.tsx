import { useState } from "react";
import type { DriverDetail } from "#/utils/queries/driverQueries";
import { EditBankingForm } from "./edit/EditBankingForm";

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-4 rounded-xl bg-gray-50">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span
        className={[
          "text-sm font-medium text-gray-800",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export function DriverBankingPanel({ driver }: { driver: DriverDetail }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-violet-600"
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
            </div>
            <h2 className="text-sm font-bold text-gray-800 flex-1">
              Banking Details
            </h2>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors"
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
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow label="Bank" value={driver.bank} />
            <InfoRow
              label="Account Number"
              value={driver.account_number}
              mono
            />
            <InfoRow
              label="Ecocash Number"
              value={driver.ecocash_number}
              mono
            />
            <InfoRow
              label="Innbucks Number"
              value={driver.innbucks_number}
              mono
            />
          </div>
        </div>
      </div>

      <EditBankingForm
        driver={driver}
        isOpen={editing}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
