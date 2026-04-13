import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface AccidentStatus {
  id: number;
  status: string;
}

export interface AccidentType {
  id: number;
  type: string;
}

async function fetchAccidentStatuses(): Promise<AccidentStatus[]> {
  const { data, error } = await supabase
    .from("accident_statuses")
    .select("id, status")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AccidentStatus[];
}

async function fetchAccidentTypes(): Promise<AccidentType[]> {
  const { data, error } = await supabase
    .from("accident_types")
    .select("id, type")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AccidentType[];
}

export const accidentStatusesQueryOptions = queryOptions({
  queryKey: ["accident_statuses"],
  queryFn: fetchAccidentStatuses,
});

export const accidentTypesQueryOptions = queryOptions({
  queryKey: ["accident_types"],
  queryFn: fetchAccidentTypes,
});

export interface AccidentReport {
  id: number;
  driver_id: number;
  driver_name: string;
  accident_status_id: number;
  accident_status: string;
  accident_type_id: number;
  accident_type: string;
  details: string | null;
  report_file: string | null;
  accident_date: string;
  created_at: string;
  updated_at: string | null;
}

async function fetchAccidentReports(): Promise<AccidentReport[]> {
  const { data, error } = await supabase
    .from("accident_reports")
    .select(
      `id, driver_id, accident_status_id, accident_type_id, details, report_file,
       accident_date, created_at, updated_at,
       drivers(driver_firstname, driver_lastname),
       accident_statuses(status),
       accident_types(type)`,
    )
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const driver = r.drivers as {
      driver_firstname: string;
      driver_lastname: string;
    } | null;
    const status = r.accident_statuses as { status: string } | null;
    const type = r.accident_types as { type: string } | null;

    return {
      id: r.id as number,
      driver_id: r.driver_id as number,
      driver_name: driver
        ? `${driver.driver_firstname} ${driver.driver_lastname}`
        : "Unknown",
      accident_status_id: r.accident_status_id as number,
      accident_status: status?.status ?? "Unknown",
      accident_type_id: r.accident_type_id as number,
      accident_type: type?.type ?? "Unknown",
      details: (r.details as string) ?? null,
      report_file: (r.report_file as string) ?? null,
      accident_date: r.accident_date as string,
      created_at: r.created_at as string,
      updated_at: (r.updated_at as string) ?? null,
    };
  });
}

export const accidentReportsQueryOptions = queryOptions({
  queryKey: ["accident_reports"],
  queryFn: fetchAccidentReports,
});

// ── Detail ─────────────────────────────────────────────────────────────────────

export interface AccidentReportDetail extends AccidentReport {
  driver_email: string;
  driver_mobile: string;
  driver_photo: string | null;
}

async function fetchAccidentReportById(
  id: number,
): Promise<AccidentReportDetail> {
  const { data, error } = await supabase
    .from("accident_reports")
    .select(
      `id, driver_id, accident_status_id, accident_type_id, details, report_file,
       accident_date, created_at, updated_at,
       drivers(driver_firstname, driver_lastname, driver_email, driver_mobile, profile_photo_file),
       accident_statuses(status),
       accident_types(type)`,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  const r = data as Record<string, unknown>;
  const driver = r.drivers as {
    driver_firstname: string;
    driver_lastname: string;
    driver_email: string;
    driver_mobile: string;
    profile_photo_file: string | null;
  } | null;
  const status = r.accident_statuses as { status: string } | null;
  const type = r.accident_types as { type: string } | null;

  const PHOTOS_BUCKET = "driver-photos";
  let photoUrl: string | null = null;
  if (driver?.profile_photo_file) {
    const { data: urlData } = supabase.storage
      .from(PHOTOS_BUCKET)
      .getPublicUrl(driver.profile_photo_file);
    photoUrl = urlData.publicUrl;
  }

  return {
    id: r.id as number,
    driver_id: r.driver_id as number,
    driver_name: driver
      ? `${driver.driver_firstname} ${driver.driver_lastname}`
      : "Unknown",
    driver_email: driver?.driver_email ?? "",
    driver_mobile: driver?.driver_mobile ?? "",
    driver_photo: photoUrl,
    accident_status_id: r.accident_status_id as number,
    accident_status: status?.status ?? "Unknown",
    accident_type_id: r.accident_type_id as number,
    accident_type: type?.type ?? "Unknown",
    details: (r.details as string) ?? null,
    report_file: (r.report_file as string) ?? null,
    accident_date: r.accident_date as string,
    created_at: r.created_at as string,
    updated_at: (r.updated_at as string) ?? null,
  };
}

export function accidentReportDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["accident_report", id],
    queryFn: () => fetchAccidentReportById(id),
  });
}

// ── Update status ──────────────────────────────────────────────────────────────

export async function updateAccidentStatus(
  reportId: number,
  statusId: number,
): Promise<void> {
  const { error } = await supabase
    .from("accident_reports")
    .update({ accident_status_id: statusId })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
}
