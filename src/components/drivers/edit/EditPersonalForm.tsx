import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import InputField from "#/components/widgets/InputField";
import PhoneField from "#/components/widgets/PhoneField";
import SelectField from "#/components/widgets/SelectField";
import TextareaField from "#/components/widgets/TextareaField";
import DatePickerField from "#/components/widgets/DatePickerField";
import FileUpload from "#/components/widgets/FileUpload";
import Button from "#/components/widgets/Button";
import { EditSectionDrawer } from "./EditSectionDrawer";
import {
  updateDriverPersonal,
  type DriverDetail,
} from "#/utils/queries/driverQueries";
import { supabase } from "#/utils/supabase";

const GENDER_OPTIONS = [
  { label: "Male", value: "1" },
  { label: "Female", value: "2" },
];

const DOCS_BUCKET = "driver-documents";
const PHOTOS_BUCKET = "driver-photos";

async function uploadSingle(
  bucket: string,
  folder: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

type Form = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  email: string;
  physicalAddress: string;
  nationalIdNumber: string;
  passportNumber: string;
  nationalIdFile: File | null;
  passportFile: File | null;
  profilePhotoFile: File | null;
};

type Errors = Partial<Record<keyof Form, string>>;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.firstName.trim()) e.firstName = "Required";
  if (!f.lastName.trim()) e.lastName = "Required";
  if (!f.dateOfBirth) e.dateOfBirth = "Required";
  if (!f.gender) e.gender = "Required";
  if (!f.mobileNumber.trim()) e.mobileNumber = "Required";
  if (!f.email.trim()) e.email = "Required";
  if (!f.physicalAddress.trim()) e.physicalAddress = "Required";
  if (!f.nationalIdNumber.trim()) e.nationalIdNumber = "Required";
  return e;
}

interface Props {
  driver: DriverDetail;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPersonalForm({ driver, isOpen, onClose }: Props) {
  const qc = useQueryClient();

  const [form, setForm] = useState<Form>({
    firstName: driver.driver_firstname,
    lastName: driver.driver_lastname,
    dateOfBirth: driver.date_of_birth ?? "",
    gender: driver.gender_id ? String(driver.gender_id) : "",
    mobileNumber: driver.driver_mobile,
    email: driver.driver_email,
    physicalAddress: driver.physical_address ?? "",
    nationalIdNumber: driver.national_id_number ?? "",
    passportNumber: driver.passport_number ?? "",
    nationalIdFile: null,
    passportFile: null,
    profilePhotoFile: null,
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
    const toastId = toast.loading("Saving personal details…");

    try {
      const [nationalIdFilePath, passportFilePath, profilePhotoFilePath] =
        await Promise.all([
          form.nationalIdFile
            ? uploadSingle(DOCS_BUCKET, "national-ids", form.nationalIdFile)
            : Promise.resolve(undefined),
          form.passportFile
            ? uploadSingle(DOCS_BUCKET, "passports", form.passportFile)
            : Promise.resolve(undefined),
          form.profilePhotoFile
            ? uploadSingle(PHOTOS_BUCKET, "profiles", form.profilePhotoFile)
            : Promise.resolve(undefined),
        ]);

      await updateDriverPersonal(driver.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        mobileNumber: form.mobileNumber,
        email: form.email,
        physicalAddress: form.physicalAddress,
        nationalIdNumber: form.nationalIdNumber,
        passportNumber: form.passportNumber || undefined,
        nationalIdFilePath,
        passportFilePath,
        profilePhotoFilePath,
      });

      await qc.invalidateQueries({ queryKey: ["driver", driver.id] });
      toast.success("Personal details updated", { id: toastId });
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
      title="Edit Personal Details"
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
        <div className="grid grid-cols-2 gap-4">
          <InputField
            id="ep-firstName"
            label="First Name"
            value={form.firstName}
            onChange={(v) => set("firstName", v)}
            error={errors.firstName}
          />
          <InputField
            id="ep-lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(v) => set("lastName", v)}
            error={errors.lastName}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DatePickerField
            id="ep-dob"
            label="Date of Birth"
            value={form.dateOfBirth}
            onChange={(v) => set("dateOfBirth", v)}
            error={errors.dateOfBirth}
          />
          <SelectField
            id="ep-gender"
            label="Gender"
            value={form.gender}
            onChange={(v) => set("gender", v)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
            error={errors.gender}
          />
        </div>

        <PhoneField
          id="ep-mobile"
          label="Mobile Number"
          value={form.mobileNumber}
          onChange={(v) => set("mobileNumber", v)}
          error={errors.mobileNumber}
        />

        <InputField
          id="ep-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
          error={errors.email}
        />

        <TextareaField
          id="ep-address"
          label="Physical Address"
          value={form.physicalAddress}
          onChange={(v) => set("physicalAddress", v)}
          rows={2}
          error={errors.physicalAddress}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            id="ep-nationalId"
            label="National ID Number"
            value={form.nationalIdNumber}
            onChange={(v) => set("nationalIdNumber", v)}
            error={errors.nationalIdNumber}
          />
          <InputField
            id="ep-passport"
            label="Passport Number"
            value={form.passportNumber}
            onChange={(v) => set("passportNumber", v)}
          />
        </div>

        {/* Replacement documents (optional — only upload if replacing) */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Replace Documents (optional)
          </p>
          <div className="space-y-3">
            <FileUpload
              label="National ID Document"
              value={form.nationalIdFile}
              onChange={(f) => set("nationalIdFile", f)}
              hint="Upload only to replace the existing file"
            />
            <FileUpload
              label="Passport Document"
              value={form.passportFile}
              onChange={(f) => set("passportFile", f)}
              hint="Upload only to replace the existing file"
            />
            <FileUpload
              label="Profile Photo"
              value={form.profilePhotoFile}
              onChange={(f) => set("profilePhotoFile", f)}
              hint="PNG or JPG — upload only to replace"
              accept={{
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
              }}
            />
          </div>
        </div>
      </div>
    </EditSectionDrawer>
  );
}
