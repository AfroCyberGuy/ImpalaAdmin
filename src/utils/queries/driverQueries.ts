import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

const PHOTOS_BUCKET = "driver-photos";

export interface Driver {
  id: number;
  code: string;
  driver_firstname: string;
  driver_lastname: string;
  driver_email: string;
  driver_mobile: string;
  profile_photo_file: string | null;
  drivers_licence_id: number | null;
  gender_id: number | null;
  created_at: string;
  // Joined
  licence_class: string | null;
  gender: string | null;
  avg_rating: number | null;
  is_available: boolean;
}

async function fetchDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from("drivers")
    .select(
      `id, code, driver_firstname, driver_lastname, driver_email, driver_mobile,
       profile_photo_file, drivers_licence_id, gender_id, created_at,
       drivers_licences(licence_class),
       genders(gender),
       driver_auths(status)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Fetch average ratings separately
  const { data: ratingsData } = await supabase
    .from("ratings")
    .select("driver_id, rating");

  const ratingMap = new Map<number, { sum: number; count: number }>();
  for (const r of ratingsData ?? []) {
    const entry = ratingMap.get(r.driver_id) ?? { sum: 0, count: 0 };
    entry.sum += r.rating;
    entry.count += 1;
    ratingMap.set(r.driver_id, entry);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const licence = r.drivers_licences as { licence_class: string } | null;
    const genderRow = r.genders as { gender: string } | null;
    const auth = r.driver_auths as { status: number }[] | null;
    const ratingEntry = ratingMap.get(r.id as number);
    const avgRating = ratingEntry
      ? Math.round((ratingEntry.sum / ratingEntry.count) * 10) / 10
      : null;

    // status = 1 means available/online in driver_auths
    const isAvailable =
      Array.isArray(auth) && auth.length > 0 ? auth[0].status === 1 : false;

    let photoUrl: string | null = null;
    if (r.profile_photo_file) {
      const { data: urlData } = supabase.storage
        .from(PHOTOS_BUCKET)
        .getPublicUrl(r.profile_photo_file as string);
      photoUrl = urlData.publicUrl;
    }

    return {
      id: r.id as number,
      code: r.code as string,
      driver_firstname: r.driver_firstname as string,
      driver_lastname: r.driver_lastname as string,
      driver_email: r.driver_email as string,
      driver_mobile: r.driver_mobile as string,
      profile_photo_file: photoUrl,
      drivers_licence_id: r.drivers_licence_id as number | null,
      gender_id: r.gender_id as number | null,
      created_at: r.created_at as string,
      licence_class: licence?.licence_class ?? null,
      gender: genderRow?.gender ?? null,
      avg_rating: avgRating,
      is_available: isAvailable,
    };
  });
}

export const driversQueryOptions = queryOptions({
  queryKey: ["drivers"],
  queryFn: fetchDrivers,
});

// ── Driver Detail ──────────────────────────────────────────────────────────────

export interface DriverTraining {
  training_type: string;
  training_date: string;
}

export interface DriverDetail extends Driver {
  date_of_birth: string | null;
  physical_address: string | null;
  national_id_number: string | null;
  passport_number: string | null;
  national_id_file: string | null;
  passport_file: string | null;
  // Next of kin
  kin_full_name: string | null;
  kin_mobile_number: string | null;
  kin_physical_address: string | null;
  // Licensing
  driving_experience: number | null;
  licence_number: string | null;
  licence_issue_date: string | null;
  drivers_licence_file: string | null;
  defensive_licence_file: string | null;
  defensive_licence_expiry: string | null;
  international_licence_file: string | null;
  first_aid_certificate_file: string | null;
  // Training
  trainings: DriverTraining[];
  // Medical
  medical_test_issue_date: string | null;
  police_clearance_issue_date: string | null;
  impala_certificate_issue_date: string | null;
  medical_test_file: string | null;
  police_clearance_file: string | null;
  proof_of_residence_file: string | null;
  // Banking
  bank: string | null;
  account_number: string | null;
  ecocash_number: string | null;
  innbucks_number: string | null;
}

const DOCS_BUCKET = "driver-documents";

// Signed URLs expire after 1 hour — sufficient for a single admin session
const SIGNED_URL_EXPIRES_IN = 3600;

async function signedDocUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function fetchDriverById(id: number): Promise<DriverDetail> {
  const { data, error } = await supabase
    .from("drivers")
    .select(
      `id, code, driver_firstname, driver_lastname, driver_email, driver_mobile,
       profile_photo_file, drivers_licence_id, gender_id, created_at,
       driver_dob, driver_address, national_id, passport_number,
       national_id_file_path, passport_file_path,
       drivers_licence, licence_issue_date, driving_experience,
       licence_file_path, defence_licence_file_path, defence_licence_expiry_date,
       idl_licence_path, first_aid_certificate_file_path,
       medical_tests_issue_date, police_clearance_issue_date,
       medical_test_file_path, police_clearance_file_path, proof_of_residence_file_path,
       bank_id, account_number, ecocash_number, innbucks_number,
       drivers_licences(licence_class),
       genders(gender),
       driver_auths(status),
       banks(bank),
       next_of_kins(fullname, mobile_number, address),
       trainings(training_date, training_types(name))`,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  const r = data as Record<string, unknown>;
  const licence = r.drivers_licences as { licence_class: string } | null;
  const genderRow = r.genders as { gender: string } | null;
  const auth = r.driver_auths as { status: number }[] | null;
  const bankRow = r.banks as { bank: string } | null;
  const kin = r.next_of_kins as
    | { fullname: string; mobile_number: string; address: string }[]
    | null;
  const trainings = r.trainings as
    | { training_date: string; training_types: { name: string } }[]
    | null;

  // Ratings
  const { data: ratingsData } = await supabase
    .from("ratings")
    .select("rating")
    .eq("driver_id", id);
  const avgRating =
    ratingsData && ratingsData.length > 0
      ? Math.round(
          (ratingsData.reduce((s, x) => s + x.rating, 0) / ratingsData.length) *
            10,
        ) / 10
      : null;

  const isAvailable =
    Array.isArray(auth) && auth.length > 0 ? auth[0].status === 1 : false;

  let photoUrl: string | null = null;
  if (r.profile_photo_file) {
    const { data: urlData } = supabase.storage
      .from(PHOTOS_BUCKET)
      .getPublicUrl(r.profile_photo_file as string);
    photoUrl = urlData.publicUrl;
  }

  const kinRow = Array.isArray(kin) && kin.length > 0 ? kin[0] : null;

  // Generate signed URLs for all private bucket files in parallel
  const [
    national_id_file,
    passport_file,
    drivers_licence_file,
    defensive_licence_file,
    international_licence_file,
    first_aid_certificate_file,
    medical_test_file,
    police_clearance_file,
    proof_of_residence_file,
  ] = await Promise.all([
    signedDocUrl(r.national_id_file_path as string | null),
    signedDocUrl(r.passport_file_path as string | null),
    signedDocUrl(r.licence_file_path as string | null),
    signedDocUrl(r.defence_licence_file_path as string | null),
    signedDocUrl(r.idl_licence_path as string | null),
    signedDocUrl(r.first_aid_certificate_file_path as string | null),
    signedDocUrl(r.medical_test_file_path as string | null),
    signedDocUrl(r.police_clearance_file_path as string | null),
    signedDocUrl(r.proof_of_residence_file_path as string | null),
  ]);

  return {
    id: r.id as number,
    code: r.code as string,
    driver_firstname: r.driver_firstname as string,
    driver_lastname: r.driver_lastname as string,
    driver_email: r.driver_email as string,
    driver_mobile: r.driver_mobile as string,
    profile_photo_file: photoUrl,
    drivers_licence_id: r.drivers_licence_id as number | null,
    gender_id: r.gender_id as number | null,
    created_at: r.created_at as string,
    licence_class: licence?.licence_class ?? null,
    gender: genderRow?.gender ?? null,
    avg_rating: avgRating,
    is_available: isAvailable,
    date_of_birth: (r.driver_dob as string) ?? null,
    physical_address: (r.driver_address as string) ?? null,
    national_id_number: (r.national_id as string) ?? null,
    passport_number: (r.passport_number as string) ?? null,
    national_id_file,
    passport_file,
    kin_full_name: kinRow?.fullname ?? null,
    kin_mobile_number: kinRow?.mobile_number ?? null,
    kin_physical_address: kinRow?.address ?? null,
    driving_experience:
      r.driving_experience != null ? Number(r.driving_experience) : null,
    licence_number: (r.drivers_licence as string) ?? null,
    licence_issue_date: (r.licence_issue_date as string) ?? null,
    drivers_licence_file,
    defensive_licence_file,
    defensive_licence_expiry: (r.defence_licence_expiry_date as string) ?? null,
    international_licence_file,
    first_aid_certificate_file,
    trainings: (trainings ?? []).map((t) => ({
      training_type: t.training_types?.name ?? "Unknown",
      training_date: t.training_date,
    })),
    medical_test_issue_date: (r.medical_tests_issue_date as string) ?? null,
    police_clearance_issue_date:
      (r.police_clearance_issue_date as string) ?? null,
    impala_certificate_issue_date: null,
    medical_test_file,
    police_clearance_file,
    proof_of_residence_file,
    bank: bankRow?.bank ?? null,
    account_number: (r.account_number as string) ?? null,
    ecocash_number: (r.ecocash_number as string) ?? null,
    innbucks_number: (r.innbucks_number as string) ?? null,
  };
}

export function driverDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["driver", id],
    queryFn: () => fetchDriverById(id),
  });
}

// ── Update mutations ───────────────────────────────────────────────────────────

export interface UpdatePersonalInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  email: string;
  physicalAddress: string;
  nationalIdNumber: string;
  passportNumber?: string;
  nationalIdFilePath?: string;
  passportFilePath?: string;
  profilePhotoFilePath?: string;
}

export interface UpdateNextOfKinInput {
  fullName: string;
  mobileNumber: string;
  physicalAddress: string;
}

export interface UpdateLicensingInput {
  drivingExperience: number;
  licenceNumber: string;
  licenceIssueDate: string;
  licenceClass: string;
  defensiveLicenceExpiry?: string;
  medicalTestIssueDate: string;
  policeClearanceIssueDate: string;
  impalaCertificateIssueDate?: string;
  driversLicenceFilePath?: string;
  defensiveLicenceFilePath?: string;
  internationalLicenceFilePath?: string;
  firstAidCertificateFilePath?: string;
  medicalTestFilePath?: string;
  policeClearanceFilePath?: string;
  proofOfResidenceFilePath?: string;
}

export interface UpdateBankingInput {
  bank: string;
  accountNumber: string;
  ecocashNumber?: string;
  innbucksNumber?: string;
}

async function invokeUpdate(body: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    "update-driver-function",
    { body },
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

export async function updateDriverPersonal(
  driverId: number,
  input: UpdatePersonalInput,
): Promise<void> {
  await invokeUpdate({ section: "personal", driverId, ...input });
}

export async function updateDriverNextOfKin(
  driverId: number,
  input: UpdateNextOfKinInput,
): Promise<void> {
  await invokeUpdate({ section: "nextOfKin", driverId, ...input });
}

export async function updateDriverLicensing(
  driverId: number,
  input: UpdateLicensingInput,
): Promise<void> {
  await invokeUpdate({ section: "licensing", driverId, ...input });
}

export async function updateDriverBanking(
  driverId: number,
  input: UpdateBankingInput,
): Promise<void> {
  await invokeUpdate({ section: "banking", driverId, ...input });
}
