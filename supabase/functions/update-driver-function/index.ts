import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UpdatePersonalPayload {
  section: "personal";
  driverId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  email: string;
  physicalAddress: string;
  nationalIdNumber: string;
  passportNumber?: string;
  // Optional replacement file paths (already uploaded before calling this function)
  nationalIdFilePath?: string;
  passportFilePath?: string;
  profilePhotoFilePath?: string;
}

interface UpdateNextOfKinPayload {
  section: "nextOfKin";
  driverId: number;
  fullName: string;
  mobileNumber: string;
  physicalAddress: string;
}

interface UpdateLicensingPayload {
  section: "licensing";
  driverId: number;
  drivingExperience: number;
  licenceNumber: string;
  licenceIssueDate: string;
  licenceClass: string;
  defensiveLicenceExpiry?: string;
  medicalTestIssueDate: string;
  policeClearanceIssueDate: string;
  impalaCertificateIssueDate?: string;
  // Optional replacement file paths
  driversLicenceFilePath?: string;
  defensiveLicenceFilePath?: string;
  internationalLicenceFilePath?: string;
  firstAidCertificateFilePath?: string;
  medicalTestFilePath?: string;
  policeClearanceFilePath?: string;
  proofOfResidenceFilePath?: string;
}

interface UpdateBankingPayload {
  section: "banking";
  driverId: number;
  bank: string;
  accountNumber: string;
  ecocashNumber?: string;
  innbucksNumber?: string;
}

type UpdateDriverPayload =
  | UpdatePersonalPayload
  | UpdateNextOfKinPayload
  | UpdateLicensingPayload
  | UpdateBankingPayload;

// ── Helpers ────────────────────────────────────────────────────────────────────

function normaliseZwNumber(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("263")) return `+${digits}`;
  if (digits.startsWith("0")) return `+263${digits.slice(1)}`;
  if (digits.length === 9) return `+263${digits}`;
  return `+263${digits.replace(/^0+/, "")}`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let payload: UpdateDriverPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload.driverId || !payload.section) {
    return jsonResponse({ error: "Missing driverId or section" }, 422);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log(
    `[update-driver] section=${payload.section} driverId=${payload.driverId}`,
  );

  try {
    // ── Personal section ────────────────────────────────────────────────────────
    if (payload.section === "personal") {
      const p = payload as UpdatePersonalPayload;

      const driverUpdate: Record<string, unknown> = {
        driver_firstname: p.firstName.trim(),
        driver_lastname: p.lastName.trim(),
        driver_mobile: normaliseZwNumber(p.mobileNumber),
        driver_email: p.email.trim().toLowerCase(),
        driver_address: p.physicalAddress.trim(),
        driver_dob: p.dateOfBirth,
        gender_id: Number(p.gender),
        national_id: p.nationalIdNumber.trim().toUpperCase(),
        passport_number: p.passportNumber
          ? p.passportNumber.trim().toUpperCase()
          : null,
      };

      if (p.nationalIdFilePath)
        driverUpdate.national_id_file_path = p.nationalIdFilePath;
      if (p.passportFilePath)
        driverUpdate.passport_file_path = p.passportFilePath;
      if (p.profilePhotoFilePath)
        driverUpdate.profile_photo_file = p.profilePhotoFilePath;

      const { error } = await supabase
        .from("drivers")
        .update(driverUpdate)
        .eq("id", p.driverId);

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    // ── Next of kin section ─────────────────────────────────────────────────────
    if (payload.section === "nextOfKin") {
      const p = payload as UpdateNextOfKinPayload;

      // Check if a kin record already exists for this driver
      const { data: existing } = await supabase
        .from("next_of_kins")
        .select("id")
        .eq("driver_id", p.driverId)
        .maybeSingle();

      const kinData = {
        driver_id: p.driverId,
        fullname: p.fullName.trim(),
        mobile_number: normaliseZwNumber(p.mobileNumber),
        address: p.physicalAddress.trim(),
      };

      let error;
      if (existing) {
        ({ error } = await supabase
          .from("next_of_kins")
          .update(kinData)
          .eq("driver_id", p.driverId));
      } else {
        ({ error } = await supabase.from("next_of_kins").insert(kinData));
      }

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    // ── Licensing section ───────────────────────────────────────────────────────
    if (payload.section === "licensing") {
      const p = payload as UpdateLicensingPayload;

      const driverUpdate: Record<string, unknown> = {
        driving_experience: p.drivingExperience,
        drivers_licence: p.licenceNumber.trim().toUpperCase(),
        licence_issue_date: p.licenceIssueDate,
        drivers_licence_id: Number(p.licenceClass),
        defence_licence_expiry_date: p.defensiveLicenceExpiry ?? null,
        medical_tests_issue_date: p.medicalTestIssueDate,
        police_clearance_issue_date: p.policeClearanceIssueDate,
      };

      if (p.driversLicenceFilePath)
        driverUpdate.licence_file_path = p.driversLicenceFilePath;
      if (p.defensiveLicenceFilePath)
        driverUpdate.defence_licence_file_path = p.defensiveLicenceFilePath;
      if (p.internationalLicenceFilePath)
        driverUpdate.idl_licence_path = p.internationalLicenceFilePath;
      if (p.firstAidCertificateFilePath)
        driverUpdate.first_aid_certificate_file_path =
          p.firstAidCertificateFilePath;
      if (p.medicalTestFilePath)
        driverUpdate.medical_test_file_path = p.medicalTestFilePath;
      if (p.policeClearanceFilePath)
        driverUpdate.police_clearance_file_path = p.policeClearanceFilePath;
      if (p.proofOfResidenceFilePath)
        driverUpdate.proof_of_residence_file_path = p.proofOfResidenceFilePath;

      const { error } = await supabase
        .from("drivers")
        .update(driverUpdate)
        .eq("id", p.driverId);

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    // ── Banking section ─────────────────────────────────────────────────────────
    if (payload.section === "banking") {
      const p = payload as UpdateBankingPayload;

      const { error } = await supabase
        .from("drivers")
        .update({
          bank_id: Number(p.bank),
          account_number: p.accountNumber.trim(),
          ecocash_number: p.ecocashNumber
            ? normaliseZwNumber(p.ecocashNumber)
            : null,
          innbucks_number: p.innbucksNumber
            ? normaliseZwNumber(p.innbucksNumber)
            : null,
        })
        .eq("id", p.driverId);

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unknown section" }, 422);
  } catch (err) {
    console.error("[update-driver] unexpected error:", err);
    return jsonResponse(
      {
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      },
      500,
    );
  }
});
