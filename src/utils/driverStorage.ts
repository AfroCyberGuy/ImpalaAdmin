import { supabase } from "./supabase";

// ── Bucket names ───────────────────────────────────────────────────────────────
// Make sure these buckets exist in your Supabase project Storage settings.
const DOCS_BUCKET = "driver-documents";
const PHOTOS_BUCKET = "driver-photos";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DriverFilePaths {
  // Required
  nationalIdFilePath: string;
  profilePhotoFilePath: string;
  driversLicenceFilePath: string;
  medicalTestFilePath: string;
  policeClearanceFilePath: string;
  proofOfResidenceFilePath: string;
  // Optional
  passportFilePath?: string;
  defensiveLicenceFilePath?: string;
  internationalLicenceFilePath?: string;
  firstAidCertificateFilePath?: string;
}

export interface DriverFileInputs {
  // Required
  nationalIdFile: File;
  profilePhotoFile: File;
  driversLicenceFile: File;
  medicalTestFile: File;
  policeClearanceFile: File;
  proofOfResidenceFile: File;
  // Optional
  passportFile?: File | null;
  defensiveLicenceFile?: File | null;
  internationalLicenceFile?: File | null;
  firstAidCertificateFile?: File | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Upload a single file to the given bucket and return the storage path.
 * Throws on failure so the caller can roll back already-uploaded files.
 */
async function uploadFile(
  bucket: string,
  folder: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const uniqueName = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(uniqueName, file, { upsert: false });

  if (error)
    throw new Error(`Storage upload failed (${uniqueName}): ${error.message}`);
  return uniqueName;
}

/**
 * Delete a list of storage paths. Used during rollback when an upload batch
 * partially succeeds before a later file fails.
 */
async function deleteFiles(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Upload all driver files to Supabase Storage.
 *
 * Files are uploaded concurrently where possible. If any required upload fails,
 * already-uploaded files are deleted before the error is re-thrown, keeping
 * Storage clean.
 *
 * Returns an object of storage paths ready to be sent to the edge function.
 */
export async function uploadDriverFiles(
  inputs: DriverFileInputs,
): Promise<DriverFilePaths> {
  const docPaths: string[] = [];
  const photoPaths: string[] = [];

  try {
    // Upload all files concurrently for speed
    const [
      nationalIdFilePath,
      profilePhotoFilePath,
      driversLicenceFilePath,
      medicalTestFilePath,
      policeClearanceFilePath,
      proofOfResidenceFilePath,
      passportFilePath,
      defensiveLicenceFilePath,
      internationalLicenceFilePath,
      firstAidCertificateFilePath,
    ] = await Promise.all([
      uploadFile(DOCS_BUCKET, "national-ids", inputs.nationalIdFile).then(
        (p) => {
          docPaths.push(p);
          return p;
        },
      ),
      uploadFile(PHOTOS_BUCKET, "profiles", inputs.profilePhotoFile).then(
        (p) => {
          photoPaths.push(p);
          return p;
        },
      ),
      uploadFile(DOCS_BUCKET, "licences", inputs.driversLicenceFile).then(
        (p) => {
          docPaths.push(p);
          return p;
        },
      ),
      uploadFile(DOCS_BUCKET, "medical", inputs.medicalTestFile).then((p) => {
        docPaths.push(p);
        return p;
      }),
      uploadFile(
        DOCS_BUCKET,
        "police-clearance",
        inputs.policeClearanceFile,
      ).then((p) => {
        docPaths.push(p);
        return p;
      }),
      uploadFile(
        DOCS_BUCKET,
        "proof-of-residence",
        inputs.proofOfResidenceFile,
      ).then((p) => {
        docPaths.push(p);
        return p;
      }),
      // Optional files — resolve to undefined if not provided
      inputs.passportFile
        ? uploadFile(DOCS_BUCKET, "passports", inputs.passportFile).then(
            (p) => {
              docPaths.push(p);
              return p;
            },
          )
        : Promise.resolve(undefined),
      inputs.defensiveLicenceFile
        ? uploadFile(
            DOCS_BUCKET,
            "defensive-licences",
            inputs.defensiveLicenceFile,
          ).then((p) => {
            docPaths.push(p);
            return p;
          })
        : Promise.resolve(undefined),
      inputs.internationalLicenceFile
        ? uploadFile(
            DOCS_BUCKET,
            "international-licences",
            inputs.internationalLicenceFile,
          ).then((p) => {
            docPaths.push(p);
            return p;
          })
        : Promise.resolve(undefined),
      inputs.firstAidCertificateFile
        ? uploadFile(
            DOCS_BUCKET,
            "first-aid",
            inputs.firstAidCertificateFile,
          ).then((p) => {
            docPaths.push(p);
            return p;
          })
        : Promise.resolve(undefined),
    ]);

    return {
      nationalIdFilePath,
      profilePhotoFilePath,
      driversLicenceFilePath,
      medicalTestFilePath,
      policeClearanceFilePath,
      proofOfResidenceFilePath,
      ...(passportFilePath && { passportFilePath }),
      ...(defensiveLicenceFilePath && { defensiveLicenceFilePath }),
      ...(internationalLicenceFilePath && { internationalLicenceFilePath }),
      ...(firstAidCertificateFilePath && { firstAidCertificateFilePath }),
    };
  } catch (err) {
    // Roll back any files that were successfully uploaded before the failure
    await Promise.all([
      deleteFiles(DOCS_BUCKET, docPaths),
      deleteFiles(PHOTOS_BUCKET, photoPaths),
    ]);
    throw err;
  }
}

/**
 * Get the public URL for a stored file.
 */
export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
