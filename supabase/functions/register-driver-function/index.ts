import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Training {
  trainingTypeId: number; // 1–6 maps to the training_types table
  trainingDate: string; // ISO date string
}

interface RegisterDriverPayload {
  // Step 1 — Driver details
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string; // numeric string ID matching genders.id
  mobileNumber: string;
  secondMobileNumber?: string;
  email: string;
  physicalAddress: string;
  nationalIdNumber: string;
  passportNumber?: string;

  // Step 1 — File paths (already uploaded to Supabase Storage before calling this function)
  nationalIdFilePath: string;
  passportFilePath?: string;
  profilePhotoFilePath: string;

  // Step 2 — Next of kin
  kinFullName: string;
  kinMobileNumber: string;
  kinPhysicalAddress: string;

  // Step 3 — Licensing
  drivingExperience: number;
  licenceNumber: string;
  licenceIssueDate: string;
  licenceClass: string; // "1"–"5"
  driversLicenceFilePath: string;
  defensiveLicenceFilePath?: string;
  defensiveLicenceExpiry?: string;
  internationalLicenceFilePath?: string;
  firstAidCertificateFilePath?: string;

  // Step 4 — Training (optional)
  trainings: Training[];

  // Step 5 — Medical and clearance
  medicalTestIssueDate: string;
  policeClearanceIssueDate: string;
  impalaCertificateIssueDate?: string;
  medicalTestFilePath: string;
  policeClearanceFilePath: string;
  proofOfResidenceFilePath: string;

  // Step 6 — Banking
  bank: string; // numeric string ID matching banks.id
  accountNumber: string;
  ecocashNumber?: string;
  innbucksNumber?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Normalise a Zimbabwe mobile number to +263XXXXXXXXX format.
 */
function normaliseZwNumber(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("263")) return `+${digits}`;
  if (digits.startsWith("0")) return `+263${digits.slice(1)}`;
  if (digits.length === 9) return `+263${digits}`;
  return `+263${digits.replace(/^0+/, "")}`;
}

/**
 * Generate a zero-padded 6-digit numeric code that is unique in the drivers table.
 */
async function generateUniqueCode(
  supabase: ReturnType<typeof createClient>,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
    const { data } = await supabase
      .from("drivers")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique driver code after 20 attempts");
}

/**
 * Send an SMS via Twilio REST API.
 */
async function sendTwilioSMS(
  to: string,
  body: string,
  accountSid: string,
  authToken: string,
  fromNumber: string,
): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Non-fatal: log but don't abort the registration
    console.error("[twilio] SMS send failed:", errText);
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS pre-flight
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

  // ── Parse body ───────────────────────────────────────────────────────────────
  let payload: RegisterDriverPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // ── Validate required fields ─────────────────────────────────────────────────
  const required: (keyof RegisterDriverPayload)[] = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "mobileNumber",
    "email",
    "physicalAddress",
    "nationalIdNumber",
    "nationalIdFilePath",
    "profilePhotoFilePath",
    "kinFullName",
    "kinMobileNumber",
    "kinPhysicalAddress",
    "drivingExperience",
    "licenceNumber",
    "licenceIssueDate",
    "licenceClass",
    "driversLicenceFilePath",
    "medicalTestIssueDate",
    "policeClearanceIssueDate",
    "medicalTestFilePath",
    "policeClearanceFilePath",
    "proofOfResidenceFilePath",
    "bank",
    "accountNumber",
  ];

  // Log the full received payload for debugging
  console.log(
    "[register-driver] received payload:",
    JSON.stringify(payload, null, 2),
  );

  const missingFields: string[] = [];
  for (const field of required) {
    const val = payload[field];
    const isEmpty =
      val === undefined ||
      val === null ||
      val === "" ||
      (field === "drivingExperience" && (val as number) < 1);
    if (isEmpty) {
      missingFields.push(`${field}=${JSON.stringify(val)}`);
    }
  }

  if (missingFields.length > 0) {
    console.log(
      "[register-driver] missing/empty required fields:",
      missingFields.join(", "),
    );
    return jsonResponse(
      { error: `Missing required field: ${missingFields[0].split("=")[0]}` },
      422,
    );
  }

  // ── Supabase service-role client (bypasses RLS for server-side inserts) ───────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Twilio credentials ───────────────────────────────────────────────────────
  const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
  const twilioFromNumber = Deno.env.get("TWILIO_FROM_NUMBER") ?? "+12089041849";

  try {
    // 1. Generate a unique 6-digit driver code
    const code = await generateUniqueCode(supabase);

    // 2. Insert the driver record
    const driverRow = {
      driver_firstname: payload.firstName.trim(),
      driver_lastname: payload.lastName.trim(),
      driver_mobile: normaliseZwNumber(payload.mobileNumber),
      driver_second_mobile: payload.secondMobileNumber
        ? normaliseZwNumber(payload.secondMobileNumber)
        : null,
      driver_email: payload.email.trim().toLowerCase(),
      driver_address: payload.physicalAddress.trim(),
      driver_dob: payload.dateOfBirth,
      gender_id: Number(payload.gender),
      national_id: payload.nationalIdNumber.trim().toUpperCase(),
      passport_number: payload.passportNumber
        ? payload.passportNumber.trim().toUpperCase()
        : null,
      national_id_file_path: payload.nationalIdFilePath,
      passport_file_path: payload.passportFilePath ?? null,
      profile_photo_file: payload.profilePhotoFilePath,
      driving_experience: payload.drivingExperience,
      drivers_licence: payload.licenceNumber.trim().toUpperCase(),
      licence_issue_date: payload.licenceIssueDate,
      drivers_licence_id: Number(payload.licenceClass),
      licence_file_path: payload.driversLicenceFilePath,
      defence_licence_file_path: payload.defensiveLicenceFilePath ?? null,
      defence_licence_expiry_date: payload.defensiveLicenceExpiry ?? null,
      idl_licence_path: payload.internationalLicenceFilePath ?? null,
      first_aid_certificate_file_path:
        payload.firstAidCertificateFilePath ?? null,
      medical_tests_issue_date: payload.medicalTestIssueDate,
      police_clearance_issue_date: payload.policeClearanceIssueDate,
      medical_test_file_path: payload.medicalTestFilePath,
      police_clearance_file_path: payload.policeClearanceFilePath,
      proof_of_residence_file_path: payload.proofOfResidenceFilePath,
      bank_id: Number(payload.bank),
      account_number: payload.accountNumber.trim(),
      ecocash_number: payload.ecocashNumber
        ? normaliseZwNumber(payload.ecocashNumber)
        : null,
      innbucks_number: payload.innbucksNumber
        ? normaliseZwNumber(payload.innbucksNumber)
        : null,
      code,
    };
    console.log(
      "[register-driver] inserting driver row:",
      JSON.stringify(driverRow, null, 2),
    );

    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .insert(driverRow)
      .select("id, code")
      .single();

    if (driverError) {
      console.error("[register-driver] driver insert error:", driverError);
      return jsonResponse({ error: driverError.message }, 500);
    }
    console.log("[register-driver] driver inserted:", JSON.stringify(driver));

    const driverId = driver.id;

    // 3. Insert next-of-kin record
    const { error: kinError } = await supabase.from("next_of_kin").insert({
      driver_id: driverId,
      fullname: payload.kinFullName.trim(),
      mobile_number: normaliseZwNumber(payload.kinMobileNumber),
      address: payload.kinPhysicalAddress.trim(),
    });

    if (kinError) {
      // Non-fatal — registration succeeded, log and move on
      console.error("[register-driver] next_of_kin insert error:", kinError);
    }

    // 4. Insert training records (optional)
    if (Array.isArray(payload.trainings) && payload.trainings.length > 0) {
      const trainingRows = payload.trainings.map((t) => ({
        driver_id: driverId,
        training_type_id: t.trainingTypeId,
        training_date: t.trainingDate,
      }));

      const { error: trainingError } = await supabase
        .from("driver_trainings")
        .insert(trainingRows);

      if (trainingError) {
        console.error(
          "[register-driver] training insert error:",
          trainingError,
        );
      }
    }

    // 5. Send Twilio SMS with the driver code (non-fatal if it fails)
    const normalisedMobile = normaliseZwNumber(payload.mobileNumber);
    if (normalisedMobile && twilioAccountSid && twilioAuthToken) {
      await sendTwilioSMS(
        normalisedMobile,
        `Welcome to Impala! Use code ${driver.code} when signing up on the Impala mobile app.`,
        twilioAccountSid,
        twilioAuthToken,
        twilioFromNumber,
      );
    }

    return jsonResponse({ success: true, driverId, code: driver.code }, 201);
  } catch (err) {
    console.error("[register-driver] unexpected error:", err);
    return jsonResponse(
      {
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      },
      500,
    );
  }
});

// ── Utility ────────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
