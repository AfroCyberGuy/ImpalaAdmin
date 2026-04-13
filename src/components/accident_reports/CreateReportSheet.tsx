import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, AlertTriangle, Search, CheckCircle2 } from "lucide-react";
import { supabase } from "#/utils/supabase";
import {
  driversQueryOptions,
  type Driver,
} from "#/utils/queries/driverQueries";
import {
  accidentStatusesQueryOptions,
  accidentTypesQueryOptions,
} from "#/utils/queries/accidentReportQueries";
import SelectField from "#/components/widgets/SelectField";
import DatePickerField from "#/components/widgets/DatePickerField";
import FileUpload from "#/components/widgets/FileUpload";

const REPORTS_BUCKET = "accident-reports";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormState {
  driverId: number | null;
  accidentDate: string;
  accidentTypeId: string;
  details: string;
  reportFile: File | null;
  accidentStatusId: string;
}

interface FormErrors {
  driverId?: string;
  accidentDate?: string;
  accidentTypeId?: string;
  details?: string;
  accidentStatusId?: string;
}

const INITIAL_FORM: FormState = {
  driverId: null,
  accidentDate: "",
  accidentTypeId: "",
  details: "",
  reportFile: null,
  accidentStatusId: "",
};

// ── Driver Search ──────────────────────────────────────────────────────────────

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
        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
      <span className="text-xs font-semibold text-white">{initials}</span>
    </div>
  );
}

interface DriverSearchProps {
  drivers: Driver[];
  selectedId: number | null;
  onSelect: (driver: Driver) => void;
  error?: string;
}

function DriverSearch({
  drivers,
  selectedId,
  onSelect,
  error,
}: DriverSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = drivers.find((d) => d.id === selectedId) ?? null;

  const suggestions =
    query.trim().length > 0
      ? drivers
          .filter((d) => {
            const q = query.toLowerCase();
            const name =
              `${d.driver_firstname} ${d.driver_lastname}`.toLowerCase();
            return name.includes(q);
          })
          .slice(0, 6)
      : [];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(driver: Driver) {
    onSelect(driver);
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onSelect({ id: 0 } as Driver);
    setQuery("");
  }

  return (
    <div ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Driver <span className="text-red-500">*</span>
      </label>

      {/* Selected driver pill */}
      {selected ? (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#2E8B57] bg-[#f7fdf9]">
          <DriverAvatar
            src={selected.profile_photo_file}
            name={`${selected.driver_firstname} ${selected.driver_lastname}`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {selected.driver_firstname} {selected.driver_lastname}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {selected.driver_email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Remove driver"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search driver by name…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:border-transparent transition ${
              error ? "border-red-400" : "border-gray-300 hover:border-gray-400"
            }`}
            style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
          />

          {/* Dropdown */}
          {open && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              {suggestions.map((driver) => (
                <li key={driver.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(driver)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <DriverAvatar
                      src={driver.profile_photo_file}
                      name={`${driver.driver_firstname} ${driver.driver_lastname}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {driver.driver_firstname} {driver.driver_lastname}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {driver.driver_email}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {open && query.trim().length > 0 && suggestions.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg px-4 py-3 text-sm text-gray-400 text-center">
              No drivers found
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main Sheet ─────────────────────────────────────────────────────────────────

interface CreateReportSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateReportSheet({
  open,
  onClose,
}: CreateReportSheetProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: drivers = [] } = useQuery(driversQueryOptions);
  const { data: statusOptions = [] } = useQuery(accidentStatusesQueryOptions);
  const { data: typeOptions = [] } = useQuery(accidentTypesQueryOptions);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setErrors({});
      setSuccess(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.driverId) newErrors.driverId = "Please select a driver.";
    if (!form.accidentDate)
      newErrors.accidentDate = "Accident date is required.";
    if (!form.accidentTypeId)
      newErrors.accidentTypeId = "Please select an accident type.";
    if (!form.accidentStatusId)
      newErrors.accidentStatusId = "Please select a status.";
    if (form.details && form.details.length > 255)
      newErrors.details = "Details must be 255 characters or less.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      let reportFilePath: string | null = null;

      // Upload file if provided
      if (form.reportFile) {
        const ext = form.reportFile.name.split(".").pop() ?? "bin";
        const path = `reports/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(REPORTS_BUCKET)
          .upload(path, form.reportFile, { upsert: false });
        if (uploadError)
          throw new Error(`File upload failed: ${uploadError.message}`);
        const { data: urlData } = supabase.storage
          .from(REPORTS_BUCKET)
          .getPublicUrl(path);
        reportFilePath = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("accident_reports")
        .insert({
          driver_id: form.driverId,
          accident_date: form.accidentDate,
          accident_type_id: Number(form.accidentTypeId),
          accident_status_id: Number(form.accidentStatusId),
          details: form.details.trim() || null,
          report_file: reportFilePath,
        });

      if (insertError) throw new Error(insertError.message);

      setSuccess(true);
      await queryClient.invalidateQueries({ queryKey: ["accident_reports"] });
      toast.success("Accident report filed successfully.");

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save report.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedDriver = drivers.find((d) => d.id === form.driverId) ?? null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create Accident Report"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                File Accident Report
              </h2>
              <p className="text-xs text-gray-400">
                All fields marked * are required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="w-8 h-8 text-[#2E8B57]" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                Report Filed
              </p>
              <p className="text-sm text-gray-400 mt-1">
                The accident report has been saved successfully.
              </p>
            </div>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
            noValidate
          >
            {/* Driver search */}
            <DriverSearch
              drivers={drivers}
              selectedId={form.driverId}
              onSelect={(d) => set("driverId", d.id || null)}
              error={errors.driverId}
            />

            {/* Accident date */}
            <DatePickerField
              id="accident-date"
              label="Accident Date *"
              value={form.accidentDate}
              onChange={(v) => set("accidentDate", v)}
              placeholder="Select accident date"
              error={errors.accidentDate}
              allowFuture={false}
            />

            {/* Accident type */}
            <SelectField
              id="accident-type"
              label="Accident Type *"
              value={form.accidentTypeId}
              onChange={(v) => set("accidentTypeId", v)}
              options={typeOptions.map((t) => ({
                label: t.type,
                value: String(t.id),
              }))}
              placeholder="Select accident type…"
              error={errors.accidentTypeId}
            />

            {/* Details */}
            <div>
              <label
                htmlFor="accident-details"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Details
              </label>
              <textarea
                id="accident-details"
                rows={3}
                maxLength={255}
                value={form.details}
                onChange={(e) => set("details", e.target.value)}
                placeholder="Briefly describe what happened…"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 bg-white resize-none focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  errors.details ? "border-red-400" : "border-gray-300"
                }`}
                style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
              />
              <div className="flex items-center justify-between mt-1 px-0.5">
                {errors.details ? (
                  <p className="text-xs text-red-500">{errors.details}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-400 ml-auto">
                  {form.details.length}/255
                </p>
              </div>
            </div>

            {/* Report file */}
            <FileUpload
              label="Report File (optional)"
              hint="PNG, JPG, PDF — max 5MB"
              accept={{
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
                "application/pdf": [".pdf"],
              }}
              maxSizeMB={5}
              value={form.reportFile}
              onChange={(f) => set("reportFile", f)}
            />

            {/* Status */}
            <SelectField
              id="accident-status"
              label="Report Status *"
              value={form.accidentStatusId}
              onChange={(v) => set("accidentStatusId", v)}
              options={statusOptions.map((s) => ({
                label: s.status,
                value: String(s.id),
              }))}
              placeholder="Select report status…"
              error={errors.accidentStatusId}
            />

            {/* Selected driver summary card */}
            {selectedDriver && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center gap-3">
                <DriverAvatar
                  src={selectedDriver.profile_photo_file}
                  name={`${selectedDriver.driver_firstname} ${selectedDriver.driver_lastname}`}
                />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">
                    Filing report for
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedDriver.driver_firstname}{" "}
                    {selectedDriver.driver_lastname}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedDriver.driver_mobile}
                  </p>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 pb-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                style={{ backgroundColor: "#2E8B57" }}
              >
                {submitting ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Saving Report…
                  </>
                ) : (
                  "Save Report"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
