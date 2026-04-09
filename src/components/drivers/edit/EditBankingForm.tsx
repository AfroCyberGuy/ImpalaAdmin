import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SelectField from "#/components/widgets/SelectField";
import InputField from "#/components/widgets/InputField";
import PhoneField from "#/components/widgets/PhoneField";
import Button from "#/components/widgets/Button";
import { EditSectionDrawer } from "./EditSectionDrawer";
import {
  updateDriverBanking,
  type DriverDetail,
} from "#/utils/queries/driverQueries";

const BANK_OPTIONS = [
  { label: "CABS", value: "1" },
  { label: "FBC", value: "2" },
  { label: "NBS", value: "3" },
  { label: "Stanbic", value: "4" },
];

type Form = {
  bank: string;
  accountNumber: string;
  ecocashNumber: string;
  innbucksNumber: string;
};

type Errors = Partial<Record<keyof Form, string>>;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.bank) e.bank = "Required";
  if (!f.accountNumber.trim()) e.accountNumber = "Required";
  return e;
}

// Reverse-map bank name → id for pre-filling the select
const BANK_NAME_TO_ID: Record<string, string> = {
  CABS: "1",
  FBC: "2",
  NBS: "3",
  Stanbic: "4",
};

interface Props {
  driver: DriverDetail;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBankingForm({ driver, isOpen, onClose }: Props) {
  const qc = useQueryClient();

  const [form, setForm] = useState<Form>({
    bank: driver.bank ? (BANK_NAME_TO_ID[driver.bank] ?? "") : "",
    accountNumber: driver.account_number ?? "",
    ecocashNumber: driver.ecocash_number ?? "",
    innbucksNumber: driver.innbucks_number ?? "",
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
    const toastId = toast.loading("Saving banking details…");

    try {
      await updateDriverBanking(driver.id, {
        bank: form.bank,
        accountNumber: form.accountNumber,
        ecocashNumber: form.ecocashNumber || undefined,
        innbucksNumber: form.innbucksNumber || undefined,
      });

      await qc.invalidateQueries({ queryKey: ["driver", driver.id] });
      toast.success("Banking details updated", { id: toastId });
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
      title="Edit Banking Details"
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
        <SelectField
          id="eb-bank"
          label="Bank"
          value={form.bank}
          onChange={(v) => set("bank", v)}
          options={BANK_OPTIONS}
          placeholder="Select bank"
          error={errors.bank}
        />

        <InputField
          id="eb-account"
          label="Account Number"
          value={form.accountNumber}
          onChange={(v) => set("accountNumber", v)}
          placeholder="Bank account number"
          error={errors.accountNumber}
        />

        <PhoneField
          id="eb-ecocash"
          label="Ecocash Number (Optional)"
          value={form.ecocashNumber}
          onChange={(v) => set("ecocashNumber", v)}
        />

        <PhoneField
          id="eb-innbucks"
          label="Innbucks Number (Optional)"
          value={form.innbucksNumber}
          onChange={(v) => set("innbucksNumber", v)}
        />
      </div>
    </EditSectionDrawer>
  );
}
