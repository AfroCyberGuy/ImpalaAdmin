import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Stepper, { type Step } from "#/components/widgets/Stepper";
import InputField from "#/components/widgets/InputField";
import SelectField from "#/components/widgets/SelectField";
import TextareaField from "#/components/widgets/TextareaField";
import DatePickerField from "#/components/widgets/DatePickerField";
import FileUpload from "#/components/widgets/FileUpload";
import Button from "#/components/widgets/Button";

export const Route = createFileRoute("/dashboard/drivers/register/")({
  component: RegisterDriver,
});

const STEPS: Step[] = [
  { label: "Driver Details" },
  { label: "Next Of Kin" },
  { label: "Licensing" },
  { label: "Impala Training" },
  { label: "Medical and Clearance" },
  { label: "Banking Details" },
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

// ── Types ──────────────────────────────────────────────────────────────────────

type Step1Form = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  secondMobileNumber: string;
  email: string;
  physicalAddress: string;
  nationalIdNumber: string;
  passportNumber: string;
  nationalIdFile: File | null;
  passportFile: File | null;
  profilePhotoFile: File | null;
};

type Step2Form = {
  fullName: string;
  mobileNumber: string;
  physicalAddress: string;
};

type Step3Form = {
  drivingExperience: string;
  licenceNumber: string;
  licenceIssueDate: string;
  licenceClass: string;
  driversLicenceFile: File | null;
  defensiveLicenceFile: File | null;
  defensiveLicenceExpiry: string;
  internationalLicenceFile: File | null;
  firstAidCertificateFile: File | null;
};

const TRAINING_ITEMS = [
  { key: "induction", label: "Impala Drivers Induction training" },
  { key: "codeOfConduct", label: "Impala drivers Code of conduct training" },
  { key: "safeDriving", label: "Impala Safe driving training" },
  {
    key: "grooming",
    label: "Impala Chauffeur drivers grooming and etiquette training",
  },
  { key: "vipCourse", label: "CMED VIP driving course" },
  { key: "inhouseRetest", label: "Impala drivers inhouse retest yearly" },
] as const;

type TrainingKey = (typeof TRAINING_ITEMS)[number]["key"];

type Step4Form = {
  trainings: Partial<Record<TrainingKey, { completed: boolean; date: string }>>;
};

type Step5Form = {
  medicalTestIssueDate: string;
  policeClearanceIssueDate: string;
  impalaCertificateIssueDate: string;
  medicalTestFile: File | null;
  policeClearanceFile: File | null;
  proofOfResidenceFile: File | null;
};

type Step6Form = {
  bank: string;
  accountNumber: string;
  ecocashNumber: string;
  innbucksNumber: string;
};

type Step6Errors = Partial<Record<keyof Step6Form, string>>;

type Step1Errors = Partial<Record<keyof Step1Form, string>>;
type Step2Errors = Partial<Record<keyof Step2Form, string>>;
type Step3Errors = Partial<Record<keyof Step3Form, string>>;

// ── Validation ─────────────────────────────────────────────────────────────────

function validateStep1(f: Step1Form): Step1Errors {
  const e: Step1Errors = {};
  if (!f.firstName.trim()) e.firstName = "First name is required";
  if (!f.lastName.trim()) e.lastName = "Last name is required";
  if (!f.dateOfBirth) e.dateOfBirth = "Date of birth is required";
  if (!f.gender) e.gender = "Gender is required";
  if (!f.mobileNumber.trim()) e.mobileNumber = "Mobile number is required";
  if (!f.email.trim()) e.email = "Email is required";
  if (!f.physicalAddress.trim())
    e.physicalAddress = "Physical address is required";
  if (!f.nationalIdNumber.trim())
    e.nationalIdNumber = "National ID number is required";
  if (!f.nationalIdFile) e.nationalIdFile = "National ID document is required";
  if (!f.profilePhotoFile) e.profilePhotoFile = "Profile photo is required";
  return e;
}

function validateStep2(f: Step2Form): Step2Errors {
  const e: Step2Errors = {};
  if (!f.fullName.trim()) e.fullName = "Next of kin full name is required";
  if (!f.mobileNumber.trim())
    e.mobileNumber = "Next of kin mobile number is required";
  if (!f.physicalAddress.trim())
    e.physicalAddress = "Next of kin address is required";
  return e;
}

function validateStep3(f: Step3Form): Step3Errors {
  const e: Step3Errors = {};
  if (!f.drivingExperience.trim())
    e.drivingExperience = "Driving experience is required";
  if (!f.licenceNumber.trim())
    e.licenceNumber = "Drivers licence number is required";
  if (!f.licenceIssueDate)
    e.licenceIssueDate = "Licence issue date is required";
  if (!f.licenceClass) e.licenceClass = "Licence class is required";
  if (!f.driversLicenceFile)
    e.driversLicenceFile = "Drivers licence document is required";
  return e;
}

// ── Component ──────────────────────────────────────────────────────────────────

function RegisterDriver() {
  const [currentStep, setCurrentStep] = useState(0);

  const [step1, setStep1] = useState<Step1Form>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    mobileNumber: "",
    secondMobileNumber: "",
    email: "",
    physicalAddress: "",
    nationalIdNumber: "",
    passportNumber: "",
    nationalIdFile: null,
    passportFile: null,
    profilePhotoFile: null,
  });

  const [step2, setStep2] = useState<Step2Form>({
    fullName: "",
    mobileNumber: "",
    physicalAddress: "",
  });

  const [step3, setStep3] = useState<Step3Form>({
    drivingExperience: "",
    licenceNumber: "",
    licenceIssueDate: "",
    licenceClass: "",
    driversLicenceFile: null,
    defensiveLicenceFile: null,
    defensiveLicenceExpiry: "",
    internationalLicenceFile: null,
    firstAidCertificateFile: null,
  });

  const [step4, setStep4] = useState<Step4Form>({ trainings: {} });

  const [step5, setStep5] = useState<Step5Form>({
    medicalTestIssueDate: "",
    policeClearanceIssueDate: "",
    impalaCertificateIssueDate: "",
    medicalTestFile: null,
    policeClearanceFile: null,
    proofOfResidenceFile: null,
  });

  const [step6, setStep6] = useState<Step6Form>({
    bank: "",
    accountNumber: "",
    ecocashNumber: "",
    innbucksNumber: "",
  });

  const [errors6, setErrors6] = useState<Step6Errors>({});

  const [errors1, setErrors1] = useState<Step1Errors>({});
  const [errors2, setErrors2] = useState<Step2Errors>({});
  const [errors3, setErrors3] = useState<Step3Errors>({});

  function setS1<K extends keyof Step1Form>(key: K, value: Step1Form[K]) {
    setStep1((prev) => ({ ...prev, [key]: value }));
    if (errors1[key]) setErrors1((prev) => ({ ...prev, [key]: undefined }));
  }

  function setS2<K extends keyof Step2Form>(key: K, value: Step2Form[K]) {
    setStep2((prev) => ({ ...prev, [key]: value }));
    if (errors2[key]) setErrors2((prev) => ({ ...prev, [key]: undefined }));
  }

  function setS3<K extends keyof Step3Form>(key: K, value: Step3Form[K]) {
    setStep3((prev) => ({ ...prev, [key]: value }));
    if (errors3[key]) setErrors3((prev) => ({ ...prev, [key]: undefined }));
  }

  function setS6<K extends keyof Step6Form>(key: K, value: Step6Form[K]) {
    setStep6((prev) => ({ ...prev, [key]: value }));
    if (errors6[key]) setErrors6((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleNext() {
    if (currentStep === 0) {
      const errs = validateStep1(step1);
      if (Object.keys(errs).length > 0) {
        setErrors1(errs);
        return;
      }
    }
    if (currentStep === 1) {
      const errs = validateStep2(step2);
      if (Object.keys(errs).length > 0) {
        setErrors2(errs);
        return;
      }
    }
    if (currentStep === 2) {
      const errs = validateStep3(step3);
      if (Object.keys(errs).length > 0) {
        setErrors3(errs);
        return;
      }
    }
    if (currentStep === 5) {
      const errs: Step6Errors = {};
      if (!step6.bank) errs.bank = "Bank is required";
      if (!step6.accountNumber.trim())
        errs.accountNumber = "Account number is required";
      if (Object.keys(errs).length > 0) {
        setErrors6(errs);
        return;
      }
      // TODO: submit all form data
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handlePrevious() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Register Driver</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new driver to the system.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
        {/* Stepper */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step content */}
        <div className="px-8 py-8">
          {currentStep === 0 && (
            <Step1 form={step1} errors={errors1} set={setS1} />
          )}
          {currentStep === 1 && (
            <Step2 form={step2} errors={errors2} set={setS2} />
          )}
          {currentStep === 2 && (
            <Step3 form={step3} errors={errors3} set={setS3} />
          )}
          {currentStep === 3 && <Step4 form={step4} set={setStep4} />}
          {currentStep === 4 && <Step5 form={step5} set={setStep5} />}
          {currentStep === 5 && (
            <Step6 form={step6} errors={errors6} set={setS6} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100">
          {currentStep === 0 ? (
            <Button variant="ghost">Cancel</Button>
          ) : (
            <Button variant="ghost" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          <Button variant="primary" onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? "Submit" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 1 — Driver Details ────────────────────────────────────────────────────

function Step1({
  form,
  errors,
  set,
}: {
  form: Step1Form;
  errors: Step1Errors;
  set: <K extends keyof Step1Form>(key: K, value: Step1Form[K]) => void;
}) {
  return (
    <>
      <h2 className="text-base font-semibold text-gray-800 mb-6">
        Driver details
      </h2>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            id="firstName"
            label="First Name"
            value={form.firstName}
            onChange={(v) => set("firstName", v)}
            placeholder="Driver firstname"
            error={errors.firstName}
          />
          <InputField
            id="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(v) => set("lastName", v)}
            placeholder="Driver lastname"
            error={errors.lastName}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DatePickerField
            id="dateOfBirth"
            label="Date Of Birth"
            value={form.dateOfBirth}
            onChange={(v) => set("dateOfBirth", v)}
            error={errors.dateOfBirth}
          />
          <SelectField
            id="gender"
            label="Select Gender"
            value={form.gender}
            onChange={(v) => set("gender", v)}
            options={GENDER_OPTIONS}
            placeholder="Gender"
            error={errors.gender}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            id="mobileNumber"
            label="Mobile Number"
            value={form.mobileNumber}
            onChange={(v) => set("mobileNumber", v)}
            placeholder="Enter mobile number"
            type="tel"
            error={errors.mobileNumber}
          />
          <InputField
            id="secondMobileNumber"
            label="Second Mobile Number"
            value={form.secondMobileNumber}
            onChange={(v) => set("secondMobileNumber", v)}
            placeholder="Enter mobile number"
            type="tel"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            id="email"
            label="Email"
            value={form.email}
            onChange={(v) => set("email", v)}
            placeholder="Enter email address"
            type="email"
            error={errors.email}
          />
          <TextareaField
            id="physicalAddress"
            label="Physical Address"
            value={form.physicalAddress}
            onChange={(v) => set("physicalAddress", v)}
            rows={2}
            error={errors.physicalAddress}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            id="nationalIdNumber"
            label="National ID Number"
            value={form.nationalIdNumber}
            onChange={(v) => set("nationalIdNumber", v)}
            placeholder="National id number"
            error={errors.nationalIdNumber}
          />
          <InputField
            id="passportNumber"
            label="Passport Number"
            value={form.passportNumber}
            onChange={(v) => set("passportNumber", v)}
            placeholder="Passport number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FileUpload
            label="Upload national Id"
            value={form.nationalIdFile}
            onChange={(f) => set("nationalIdFile", f)}
            error={errors.nationalIdFile}
          />
          <FileUpload
            label="Upload passport"
            value={form.passportFile}
            onChange={(f) => set("passportFile", f)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FileUpload
            label="Upload profile photo"
            hint="PNG, JPG, max file size: 3MB"
            accept={{
              "image/png": [".png"],
              "image/jpeg": [".jpg", ".jpeg"],
            }}
            value={form.profilePhotoFile}
            onChange={(f) => set("profilePhotoFile", f)}
            error={errors.profilePhotoFile}
          />
        </div>
      </div>
    </>
  );
}

// ── Step 2 — Next Of Kin ───────────────────────────────────────────────────────

function Step2({
  form,
  errors,
  set,
}: {
  form: Step2Form;
  errors: Step2Errors;
  set: <K extends keyof Step2Form>(key: K, value: Step2Form[K]) => void;
}) {
  return (
    <>
      <h2 className="text-base font-semibold text-gray-800 mb-6">
        Next of kin details
      </h2>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            id="kinFullName"
            label="Full Name"
            value={form.fullName}
            onChange={(v) => set("fullName", v)}
            placeholder="Next of kin full name"
            error={errors.fullName}
          />
          <InputField
            id="kinMobileNumber"
            label="Mobile Number"
            value={form.mobileNumber}
            onChange={(v) => set("mobileNumber", v)}
            placeholder="Mobile number"
            type="tel"
            error={errors.mobileNumber}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextareaField
            id="kinPhysicalAddress"
            label="Physical Address"
            value={form.physicalAddress}
            onChange={(v) => set("physicalAddress", v)}
            rows={3}
            error={errors.physicalAddress}
          />
        </div>
      </div>
    </>
  );
}

// ── Step 3 — Licensing ─────────────────────────────────────────────────────────

const LICENCE_CLASS_OPTIONS = [
  { label: "Class 1", value: "1" },
  { label: "Class 2", value: "2" },
  { label: "Class 3", value: "3" },
  { label: "Class 4", value: "4" },
  { label: "Class 5", value: "5" },
];

function Step3({
  form,
  errors,
  set,
}: {
  form: Step3Form;
  errors: Step3Errors;
  set: <K extends keyof Step3Form>(key: K, value: Step3Form[K]) => void;
}) {
  return (
    <>
      <h2 className="text-base font-semibold text-gray-800 mb-6">
        Licensing information
      </h2>
      <div className="space-y-5">
        {/* Row 1 — Experience + Licence number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            id="drivingExperience"
            label="Driving Experience"
            value={form.drivingExperience}
            onChange={(v) => set("drivingExperience", v)}
            placeholder="Driving experience"
            error={errors.drivingExperience}
          />
          <InputField
            id="licenceNumber"
            label="Drivers licence number"
            value={form.licenceNumber}
            onChange={(v) => set("licenceNumber", v)}
            placeholder="Licence number"
            error={errors.licenceNumber}
          />
        </div>

        {/* Row 2 — Issue date + Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DatePickerField
            id="licenceIssueDate"
            label="Licence Issue Date"
            value={form.licenceIssueDate}
            onChange={(v) => set("licenceIssueDate", v)}
            error={errors.licenceIssueDate}
          />
          <SelectField
            id="licenceClass"
            label="Select class"
            value={form.licenceClass}
            onChange={(v) => set("licenceClass", v)}
            options={LICENCE_CLASS_OPTIONS}
            placeholder="Drivers licence class"
            error={errors.licenceClass}
          />
        </div>

        {/* Row 3 — Drivers licence + Defensive licence uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FileUpload
            label="Upload Drivers Licence"
            value={form.driversLicenceFile}
            onChange={(f) => set("driversLicenceFile", f)}
            error={errors.driversLicenceFile}
          />
          <FileUpload
            label="Upload Defensive Licence"
            value={form.defensiveLicenceFile}
            onChange={(f) => set("defensiveLicenceFile", f)}
          />
        </div>

        {/* Row 4 — Defensive expiry + First aid (right col) / International licence (left col) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FileUpload
            label="Upload International Drivers Licence"
            value={form.internationalLicenceFile}
            onChange={(f) => set("internationalLicenceFile", f)}
          />
          <div className="space-y-5">
            <DatePickerField
              id="defensiveLicenceExpiry"
              label="Defensive Licence Expiry Date"
              value={form.defensiveLicenceExpiry}
              onChange={(v) => set("defensiveLicenceExpiry", v)}
              allowFuture
            />
            <FileUpload
              label="First Aid Certificate"
              value={form.firstAidCertificateFile}
              onChange={(f) => set("firstAidCertificateFile", f)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Step 4 — Impala Training ───────────────────────────────────────────────────

function Step4({
  form,
  set,
}: {
  form: Step4Form;
  set: (value: Step4Form) => void;
}) {
  function toggleItem(key: TrainingKey, checked: boolean) {
    set({
      trainings: {
        ...form.trainings,
        [key]: { completed: checked, date: form.trainings[key]?.date ?? "" },
      },
    });
  }

  function setDate(key: TrainingKey, date: string) {
    set({
      trainings: {
        ...form.trainings,
        [key]: { completed: true, date },
      },
    });
  }

  return (
    <>
      <h2 className="text-base font-semibold text-gray-800 mb-6">
        Impala Training
      </h2>
      <div className="space-y-4">
        {TRAINING_ITEMS.map(({ key, label }) => {
          const item = form.trainings[key];
          const isChecked = item?.completed ?? false;

          return (
            <div key={key}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => toggleItem(key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-[#2E8B57] cursor-pointer"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  {label}
                </span>
              </label>

              {isChecked && (
                <div className="mt-2 ml-7 w-64">
                  <p className="text-xs text-gray-500 mb-1">
                    Date of completion
                  </p>
                  <DatePickerField
                    id={`training-date-${key}`}
                    label=""
                    value={item?.date ?? ""}
                    onChange={(v) => setDate(key, v)}
                    placeholder="Date of completion"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Step 5 — Medical and Police Clearance ──────────────────────────────────────

function Step5({
  form,
  set,
}: {
  form: Step5Form;
  set: React.Dispatch<React.SetStateAction<Step5Form>>;
}) {
  function s<K extends keyof Step5Form>(key: K, value: Step5Form[K]) {
    set((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <h2 className="text-base font-semibold text-gray-800 mb-6">
        Medical and Police Clearance
      </h2>
      <div className="space-y-5">
        {/* Row 1 — Issue dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DatePickerField
            id="medicalTestIssueDate"
            label="Medical Test Issue Date"
            value={form.medicalTestIssueDate}
            onChange={(v) => s("medicalTestIssueDate", v)}
            placeholder="Medical Test Issue Date"
          />
          <DatePickerField
            id="policeClearanceIssueDate"
            label="Police Clearance Issue Date"
            value={form.policeClearanceIssueDate}
            onChange={(v) => s("policeClearanceIssueDate", v)}
            placeholder="Police Clearance Issue Date"
          />
        </div>

        {/* Row 2 — File uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FileUpload
            label="Upload Medical Test"
            value={form.medicalTestFile}
            onChange={(f) => s("medicalTestFile", f)}
          />
          <FileUpload
            label="Upload Police Clearence"
            value={form.policeClearanceFile}
            onChange={(f) => s("policeClearanceFile", f)}
          />
        </div>

        {/* Row 3 — Impala certificate date (left) + Proof of residence (right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DatePickerField
            id="impalaCertificateIssueDate"
            label="Impala Certificate Issue Date"
            value={form.impalaCertificateIssueDate}
            onChange={(v) => s("impalaCertificateIssueDate", v)}
            placeholder="Impala Certificate Issue Date"
          />
          <FileUpload
            label="Upload Proof Of Residence"
            value={form.proofOfResidenceFile}
            onChange={(f) => s("proofOfResidenceFile", f)}
          />
        </div>
      </div>
    </>
  );
}

// ── Step 6 — Banking Details ───────────────────────────────────────────────────

const BANK_OPTIONS = [
  { label: "CBZ Bank", value: "cbz" },
  { label: "FBC Bank", value: "fbc" },
  { label: "Stanbic Bank", value: "stanbic" },
  { label: "Standard Chartered", value: "standard_chartered" },
  { label: "ZB Bank", value: "zb" },
  { label: "NMB Bank", value: "nmb" },
  { label: "Steward Bank", value: "steward" },
  { label: "BancABC", value: "bancabc" },
];

function Step6({
  form,
  errors,
  set,
}: {
  form: Step6Form;
  errors: Step6Errors;
  set: <K extends keyof Step6Form>(key: K, value: Step6Form[K]) => void;
}) {
  return (
    <>
      <h2 className="text-base font-semibold text-gray-800 mb-6">
        Banking Details
      </h2>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SelectField
            id="bank"
            label="Select Bank"
            value={form.bank}
            onChange={(v) => set("bank", v)}
            options={BANK_OPTIONS}
            placeholder="Bank"
            error={errors.bank}
          />
          <InputField
            id="ecocashNumber"
            label="Ecocash Number (Optional)"
            value={form.ecocashNumber}
            onChange={(v) => set("ecocashNumber", v)}
            placeholder="Ecocash number"
            type="tel"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            id="accountNumber"
            label="Account Number"
            value={form.accountNumber}
            onChange={(v) => set("accountNumber", v)}
            placeholder="Bank account number"
            error={errors.accountNumber}
          />
          <InputField
            id="innbucksNumber"
            label="Innbucks Number (Optional)"
            value={form.innbucksNumber}
            onChange={(v) => set("innbucksNumber", v)}
            placeholder="Innbucks number"
            type="tel"
          />
        </div>
      </div>
    </>
  );
}
