import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  accidentReportDetailQueryOptions,
  accidentStatusesQueryOptions,
  updateAccidentStatus,
} from "#/utils/queries/accidentReportQueries";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Tag,
  User,
  X,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/accident_reports/$reportId/")({
  component: ViewAccidentReport,
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Edit Status Dialog ─────────────────────────────────────────────────────────

function EditStatusDialog({
  reportId,
  currentStatusId,
  onClose,
}: {
  reportId: number;
  currentStatusId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: statuses = [], isLoading } = useQuery(
    accidentStatusesQueryOptions,
  );
  const [selected, setSelected] = useState<number>(currentStatusId);

  const mutation = useMutation({
    mutationFn: (statusId: number) => updateAccidentStatus(reportId, statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accident_report", reportId],
      });
      queryClient.invalidateQueries({ queryKey: ["accident_reports"] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2E8B57]" />
            <h2 className="text-sm font-semibold text-gray-900">
              Update Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status options */}
        <div className="px-4 py-3 space-y-1.5 max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded-xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            statuses.map((s) => {
              const isActive = s.id === selected;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? "bg-[#2E8B57] text-white"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-white" : "bg-gray-300"}`}
                  />
                  {s.status}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate(selected)}
            disabled={selected === currentStatusId || mutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2E8B57] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>

        {mutation.isError && (
          <p className="px-5 pb-4 text-xs text-red-500">
            {(mutation.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "bg-gray-100 text-gray-600";
  let dot = "bg-gray-400";

  if (s.includes("open") || s.includes("filed") || s.includes("pending")) {
    cls = "bg-amber-100 text-amber-700";
    dot = "bg-amber-500";
  } else if (s.includes("closed") || s.includes("resolved")) {
    cls = "bg-emerald-100 text-emerald-700";
    dot = "bg-emerald-500";
  } else if (s.includes("reject") || s.includes("dismiss")) {
    cls = "bg-red-100 text-red-700";
    dot = "bg-red-500";
  } else if (s.includes("review") || s.includes("investigat")) {
    cls = "bg-blue-100 text-blue-700";
    dot = "bg-blue-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${cls}`}
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

// ── Detail Field ───────────────────────────────────────────────────────────────

function DetailField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

// ── Driver Avatar ──────────────────────────────────────────────────────────────

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
        className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-md"
      />
    );
  }
  return (
    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-4 ring-white shadow-md">
      <span className="text-xl font-bold text-white">{initials}</span>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded-xl" />
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 bg-gray-100 rounded-lg" />
            <div className="h-3.5 w-28 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-40 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function ViewAccidentReport() {
  const { reportId } = Route.useParams();
  const id = Number(reportId);
  const [editStatusOpen, setEditStatusOpen] = useState(false);

  const {
    data: report,
    isLoading,
    error,
  } = useQuery(accidentReportDetailQueryOptions(id));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackButton />
        <Skeleton />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <BackButton />
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-16 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-base font-semibold text-gray-800">
            Report not found
          </p>
          <p className="text-sm text-gray-400">
            {error ? (error as Error).message : "This report does not exist."}
          </p>
        </div>
      </div>
    );
  }

  const isPdf = report.report_file?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back */}
      <BackButton />

      {/* Page title row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Accident Report{" "}
            <span className="text-gray-400 font-normal text-xl">
              #{report.id}
            </span>
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Filed on {formatDateTime(report.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={report.accident_status} />
          <button
            onClick={() => setEditStatusOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {editStatusOpen && (
        <EditStatusDialog
          reportId={report.id}
          currentStatusId={report.accident_status_id}
          onClose={() => setEditStatusOpen(false)}
        />
      )}

      {/* Driver card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-1 py-1">
          <div
            className="rounded-xl bg-linear-to-r from-[#2E8B57]/8 to-emerald-50 px-5 py-4 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(to right, rgb(46 139 87 / 0.08), rgb(236 253 245))",
            }}
          >
            <DriverAvatar src={report.driver_photo} name={report.driver_name} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#2E8B57] uppercase tracking-wide mb-0.5">
                Driver
              </p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {report.driver_name}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {report.driver_email && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5" />
                    {report.driver_email}
                  </span>
                )}
                {report.driver_mobile && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    {report.driver_mobile}
                  </span>
                )}
              </div>
            </div>
            <Link
              to="/dashboard/drivers/$driverId"
              params={{ driverId: String(report.driver_id) }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2E8B57] bg-white border border-[#2E8B57]/30 hover:bg-[#2E8B57] hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              View Driver
            </Link>
          </div>
        </div>
      </div>

      {/* Report details grid */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
          Incident Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <DetailField
            icon={<Calendar className="w-4 h-4" />}
            label="Accident Date"
            value={formatDate(report.accident_date)}
          />
          <DetailField
            icon={<Tag className="w-4 h-4" />}
            label="Accident Type"
            value={
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                {report.accident_type}
              </span>
            }
          />
          <DetailField
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Report Status"
            value={<StatusBadge status={report.accident_status} />}
          />
          <DetailField
            icon={<Clock className="w-4 h-4" />}
            label="Date Filed"
            value={formatDateTime(report.created_at)}
          />
          {report.updated_at && (
            <DetailField
              icon={<Clock className="w-4 h-4" />}
              label="Last Updated"
              value={formatDateTime(report.updated_at)}
            />
          )}
        </div>
      </div>

      {/* Details / notes */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Description
        </h2>
        {report.details ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {report.details}
          </p>
        ) : (
          <p className="text-sm text-gray-300 italic">
            No description provided.
          </p>
        )}
      </div>

      {/* Report file */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Attached Report
        </h2>
        {report.report_file ? (
          isPdf ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-100">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  accident_report_{report.id}.pdf
                </p>
                <p className="text-xs text-gray-400 mt-0.5">PDF Document</p>
              </div>
              <a
                href={report.report_file}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2E8B57] hover:opacity-90 transition-opacity"
              >
                Open PDF
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                <img
                  src={report.report_file}
                  alt="Accident report"
                  className="w-full max-h-80 object-contain"
                />
              </div>
              <a
                href={report.report_file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#2E8B57] border border-[#2E8B57]/30 bg-white hover:bg-[#2E8B57] hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
                Open Full Image
              </a>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200">
            <FileText className="w-5 h-5 text-gray-300" />
            <p className="text-sm text-gray-400 italic">No file attached.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BackButton() {
  return (
    <Link
      to="/dashboard/accident_reports"
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Accident Reports
    </Link>
  );
}
