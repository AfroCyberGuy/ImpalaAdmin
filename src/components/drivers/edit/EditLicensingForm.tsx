import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import InputField from "#/components/widgets/InputField";
import SelectField from "#/components/widgets/SelectField";
import DatePickerField from "#/components/widgets/DatePickerField";
import FileUpload from "#/components/widgets/FileUpload";
import Button from "#/components/widgets/Button";
import { EditSectionDrawer } from "./EditSectionDrawer";
import {
  updateDriverLicensing,
  type DriverDetail,
} from "#/utils/queries/driverQueries";
import { supabase } from "#/utils/supabase";

const DOCS_BUCKET = "driver-documents";

const LICENCE_CLASS_OPTIONS = [
  { label: "Class 4", value: "1" },
  { label: "Class 2", value: "2" },
  { label: "Class 1", value: "3" },
];

async function uploadSingle(folder: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, file, { upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

type Form = {
  drivingExperience: string;
  licenceNumber: string;
  licenceIssueDate: string;
  licenceClass: string;
  defensiveLicenceExpiry: string;
  medicalTestIssueDate: string;
  policeClearanceIssueDate: string;
  impalaCertificateIssueDate: string;
  driversLicenceFile: File | null;
  defensiveLicenceFile: File | null;
  internationalLicenceFile: File | null;
  firstAidCertificateFile: File | null;
  medicalTestFile: File | null;
  policeClearanceFile: File | null;
  proofOfResidenceFile: File | null;
};

type Errors = Partial<Record<keyof Form, string>>;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.drivingExperience.trim() || Number(f.drivingExperience) < 1)
    e.drivingExperience = "Minimum 1 year required";
  if (!f.licenceNumber.trim()) e.licenceNumber = "Required";
  if (!f.licenceIssueDate) e.licenceIssueDate = "Required";
  if (!f.licenceClass) e.licenceClass = "Required";
  if (!f.medicalTestIssueDate) e.medicalTestIssueDate = "Required";
  if (!f.policeClearanceIssueDate) e.policeClearanceIssueDate = "Required";
  return e;
}

interface Props {
  driver: DriverDetail;
  isOpen: boolean;
  onClose: () => void;
}

export function EditLicensingForm({ driver, isOpen, onClose }: Props) {
  const qc = useQueryClient();

  const [form, setForm] = useState<Form>({
    drivingExperience: driver.driving_experience
      ? String(driver.driving_experience)
      : "",
    licenceNumber: driver.licence_number ?? "",
    licenceIssueDate: driver.licence_issue_date ?? "",
    licenceClass: driver.drivers_licence_id
      ? String(driver.drivers_licence_id)
      : "",
    defensiveLicenceExpiry: driver.defensive_licence_expiry ?? "",
    medicalTestIssueDate: driver.medical_test_issue_date ?? "",
    policeClearanceIssueDate: driver.police_clearance_issue_date ?? "",
    impalaCertificateIssueDate: driver.impala_certificate_issue_date ?? "",
    driversLicenceFile: null,
    defensiveLicenceFile: null,
    internationalLicenceFile: null,
    firstAidCertificateFile: null,
    medicalTestFile: null,
    policeClearanceFile: null,
    proofOfResidenceFile: null,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Saving licensing details…");

    try {
      const [
        driversLicenceFilePath,
        defensiveLicenceFilePath,
        internationalLicenceFilePath,
        firstAidCertificateFilePath,
        medicalTestFilePath,
        policeClearanceFilePath,
        proofOfResidenceFilePath,
      ] = await Promise.all([
        form.driversLicenceFile
          ? uploadSingle("licences", form.driversLicenceFile)
          : Promise.resolve(undefined),
        form.defensiveLicenceFile
          ? uploadSingle("defensive-licences", form.defensiveLicenceFile)
          : Promise.resolve(undefined),
        form.internationalLicenceFile
          ? uploadSingle(
              "international-licences",
              form.internationalLicenceFile,
            )
          : Promise.resolve(undefined),
        form.firstAidCertificateFile
          ? uploadSingle("first-aid", form.firstAidCertificateFile)
          : Promise.resolve(undefined),
        form.medicalTestFile
          ? uploadSingle("medical", form.medicalTestFile)
          : Promise.resolve(undefined),
        form.policeClearanceFile
          ? uploadSingle("police-clearance", form.policeClearanceFile)
          : Promise.resolve(undefined),
        form.proofOfResidenceFile
          ? uploadSingle("proof-of-residence", form.proofOfResidenceFile)
          : Promise.resolve(undefined),
      ]);

      await updateDriverLicensing(driver.id, {
        drivingExperience: Number(form.drivingExperience),
        licenceNumber: form.licenceNumber,
        licenceIssueDate: form.licenceIssueDate,
        licenceClass: form.licenceClass,
        defensiveLicenceExpiry: form.defensiveLicenceExpiry || undefined,
        medicalTestIssueDate: form.medicalTestIssueDate,
        policeClearanceIssueDate: form.policeClearanceIssueDate,
        impalaCertificateIssueDate:
          form.impalaCertificateIssueDate || undefined,
        driversLicenceFilePath,
        defensiveLicenceFilePath,
        internationalLicenceFilePath,
        firstAidCertificateFilePath,
        medicalTestFilePath,
        policeClearanceFilePath,
        proofOfResidenceFilePath,
      });

      await qc.invalidateQueries({ queryKey: ["driver", driver.id] });
      toast.success("Licensing details updated", { id: toastId });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditSectionDrawer
      title="Edit Licensing & Clearance"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Licence details */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Licence Details
        </p>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            id="el-exp"
            label="Driving Experience (years)"
            type="number"
            value={form.drivingExperience}
            onChange={(v) => set("drivingExperience", v)}
            error={errors.drivingExperience}
          />
          <InputField
            id="el-licenceNum"
            label="Licence Number"
            value={form.licenceNumber}
            onChange={(v) => set("licenceNumber", v)}
            error={errors.licenceNumber}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DatePickerField
            id="el-licenceDate"
            label="Licence Issue Date"
            value={form.licenceIssueDate}
            onChange={(v) => set("licenceIssueDate", v)}
            error={errors.licenceIssueDate}
          />
          <SelectField
            id="el-class"
            label="Licence Class"
            value={form.licenceClass}
            onChange={(v) => set("licenceClass", v)}
            options={LICENCE_CLASS_OPTIONS}
            placeholder="Select class"
            error={errors.licenceClass}
          />
        </div>

        <DatePickerField
          id="el-defExpiry"
          label="Defensive Licence Expiry"
          value={form.defensiveLicenceExpiry}
          onChange={(v) => set("defensiveLicenceExpiry", v)}
          allowFuture
        />

        {/* Medical & clearance dates */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Medical &amp; Clearance Dates
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DatePickerField
                id="el-medDate"
                label="Medical Test Issue Date"
                value={form.medicalTestIssueDate}
                onChange={(v) => set("medicalTestIssueDate", v)}
                error={errors.medicalTestIssueDate}
              />
              <DatePickerField
                id="el-polDate"
                label="Police Clearance Issue Date"
                value={form.policeClearanceIssueDate}
                onChange={(v) => set("policeClearanceIssueDate", v)}
                error={errors.policeClearanceIssueDate}
              />
            </div>
            <DatePickerField
              id="el-impalaDate"
              label="Impala Certificate Issue Date"
              value={form.impalaCertificateIssueDate}
              onChange={(v) => set("impalaCertificateIssueDate", v)}
            />
          </div>
        </div>

        {/* Replacement documents */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Replace Documents (optional)
          </p>
          <div className="space-y-3">
            <FileUpload
              label="Drivers Licence"
              value={form.driversLicenceFile}
              onChange={(f) => set("driversLicenceFile", f)}
              hint="Upload only to replace existing"
            />
            <FileUpload
              label="Defensive Licence"
              value={form.defensiveLicenceFile}
              onChange={(f) => set("defensiveLicenceFile", f)}
              hint="Upload only to replace existing"
            />
            <FileUpload
              label="International Licence"
              value={form.internationalLicenceFile}
              onChange={(f) => set("internationalLicenceFile", f)}
              hint="Upload only to replace existing"
            />
            <FileUpload
              label="First Aid Certificate"
              value={form.firstAidCertificateFile}
              onChange={(f) => set("firstAidCertificateFile", f)}
              hint="Upload only to replace existing"
            />
            <FileUpload
              label="Medical Test"
              value={form.medicalTestFile}
              onChange={(f) => set("medicalTestFile", f)}
              hint="Upload only to replace existing"
            />
            <FileUpload
              label="Police Clearance"
              value={form.policeClearanceFile}
              onChange={(f) => set("policeClearanceFile", f)}
              hint="Upload only to replace existing"
            />
            <FileUpload
              label="Proof of Residence"
              value={form.proofOfResidenceFile}
              onChange={(f) => set("proofOfResidenceFile", f)}
              hint="Upload only to replace existing"
            />
          </div>
        </div>
      </div>
    </EditSectionDrawer>
  );
}
