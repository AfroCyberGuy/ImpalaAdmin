import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import InputField from "#/components/widgets/InputField";
import PhoneField from "#/components/widgets/PhoneField";
import TextareaField from "#/components/widgets/TextareaField";
import Button from "#/components/widgets/Button";
import { EditSectionDrawer } from "./EditSectionDrawer";
import {
  updateDriverNextOfKin,
  type DriverDetail,
} from "#/utils/queries/driverQueries";

type Form = {
  fullName: string;
  mobileNumber: string;
  physicalAddress: string;
};

type Errors = Partial<Record<keyof Form, string>>;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.fullName.trim()) e.fullName = "Required";
  if (!f.mobileNumber.trim()) e.mobileNumber = "Required";
  if (!f.physicalAddress.trim()) e.physicalAddress = "Required";
  return e;
}

interface Props {
  driver: DriverDetail;
  isOpen: boolean;
  onClose: () => void;
}

export function EditNextOfKinForm({ driver, isOpen, onClose }: Props) {
  const qc = useQueryClient();

  const [form, setForm] = useState<Form>({
    fullName: driver.kin_full_name ?? "",
    mobileNumber: driver.kin_mobile_number ?? "",
    physicalAddress: driver.kin_physical_address ?? "",
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
    const toastId = toast.loading("Saving next of kin…");

    try {
      await updateDriverNextOfKin(driver.id, {
        fullName: form.fullName,
        mobileNumber: form.mobileNumber,
        physicalAddress: form.physicalAddress,
      });

      await qc.invalidateQueries({ queryKey: ["driver", driver.id] });
      toast.success("Next of kin updated", { id: toastId });
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
      title="Edit Next of Kin"
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
        <InputField
          id="ek-fullName"
          label="Full Name"
          value={form.fullName}
          onChange={(v) => set("fullName", v)}
          placeholder="Next of kin full name"
          error={errors.fullName}
        />

        <PhoneField
          id="ek-mobile"
          label="Mobile Number"
          value={form.mobileNumber}
          onChange={(v) => set("mobileNumber", v)}
          error={errors.mobileNumber}
        />

        <TextareaField
          id="ek-address"
          label="Physical Address"
          value={form.physicalAddress}
          onChange={(v) => set("physicalAddress", v)}
          rows={3}
          error={errors.physicalAddress}
        />
      </div>
    </EditSectionDrawer>
  );
}
