import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

// ── Hire Driver Types ──────────────────────────────────────────────────────────

export interface HireDriverType {
  id: number;
  hire_type: string;
  created_at: string;
  updated_at: string | null;
}

async function fetchHireDriverTypes(): Promise<HireDriverType[]> {
  const { data, error } = await supabase
    .from("hire_driver_types")
    .select("id, hire_type, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export const hireDriverTypesQueryOptions = queryOptions({
  queryKey: ["hire_driver_types"],
  queryFn: fetchHireDriverTypes,
});

export async function addHireDriverType(hire_type: string): Promise<void> {
  const { error } = await supabase
    .from("hire_driver_types")
    .insert({ hire_type });
  if (error) throw new Error(error.message);
}

export async function updateHireDriverType(
  id: number,
  hire_type: string,
): Promise<void> {
  const { error } = await supabase
    .from("hire_driver_types")
    .update({ hire_type })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteHireDriverType(id: number): Promise<void> {
  const { error } = await supabase
    .from("hire_driver_types")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Hire Driver Rates ──────────────────────────────────────────────────────────

export interface HireDriverRate {
  id: number;
  hire_driver_type_id: number;
  amount: number;
  created_at: string;
  updated_at: string | null;
  hire_driver_types: { hire_type: string };
}

async function fetchHireDriverRates(): Promise<HireDriverRate[]> {
  const { data, error } = await supabase
    .from("hire_driver_rates")
    .select(
      "id, hire_driver_type_id, amount, created_at, updated_at, hire_driver_types(hire_type)",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as HireDriverRate[];
}

export const hireDriverRatesQueryOptions = queryOptions({
  queryKey: ["hire_driver_rates"],
  queryFn: fetchHireDriverRates,
});

export async function addHireDriverRate(payload: {
  hire_driver_type_id: number;
  amount: number;
}): Promise<void> {
  const { error } = await supabase.from("hire_driver_rates").insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateHireDriverRate(
  id: number,
  amount: number,
): Promise<void> {
  const { error } = await supabase
    .from("hire_driver_rates")
    .update({ amount })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteHireDriverRate(id: number): Promise<void> {
  const { error } = await supabase
    .from("hire_driver_rates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Driver Bookings ────────────────────────────────────────────────────────────

export interface DriverBooking {
  id: number;
  date_of_hire: string;
  time_of_hire: string | null;
  phonenumber: string;
  comments: string;
  created_at: string;
  // Client
  client_name: string;
  client_avatar: string | null;
  // Driver
  driver_name: string | null;
  driver_photo: string | null;
  driver_mobile: string | null;
  // Required licence class (from driver_bookings.drivers_licence_id)
  required_class: string | null;
  // Rate / hire type
  hire_type: string | null;
  amount: number | null;
  // Status
  booking_status: string | null;
}

async function fetchDriverBookings(): Promise<DriverBooking[]> {
  const { data, error } = await supabase
    .from("driver_bookings")
    .select(
      `id, date_of_hire, time_of_hire, phonenumber, comments, created_at,
       clients(name, supabase_image_url),
       drivers(driver_firstname, driver_lastname, driver_mobile, profile_photo_file),
       drivers_licences(licence_class),
       hire_driver_rates(amount, hire_driver_types(hire_type)),
       hire_driver_statuses(status)`,
    )
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const client = r.clients as {
      name: string;
      supabase_image_url: string | null;
    } | null;
    const driver = r.drivers as {
      driver_firstname: string;
      driver_lastname: string;
      driver_mobile: string | null;
      profile_photo_file: string | null;
    } | null;
    const rate = r.hire_driver_rates as {
      amount: number;
      hire_driver_types: { hire_type: string } | null;
    } | null;
    const licenceRow = r.drivers_licences as { licence_class: string } | null;
    const statusRow = r.hire_driver_statuses as { status: string } | null;

    let driverPhoto: string | null = null;
    if (driver?.profile_photo_file) {
      const { data: urlData } = supabase.storage
        .from("driver-photos")
        .getPublicUrl(driver.profile_photo_file);
      driverPhoto = urlData.publicUrl;
    }

    return {
      id: r.id as number,
      date_of_hire: r.date_of_hire as string,
      time_of_hire: (r.time_of_hire as string) ?? null,
      phonenumber: r.phonenumber as string,
      comments: r.comments as string,
      created_at: r.created_at as string,
      client_name: client?.name ?? "Unknown",
      client_avatar: client?.supabase_image_url ?? null,
      driver_name: driver
        ? `${driver.driver_firstname} ${driver.driver_lastname}`
        : null,
      driver_photo: driverPhoto,
      driver_mobile: driver?.driver_mobile ?? null,
      required_class: licenceRow?.licence_class ?? null,
      hire_type: rate?.hire_driver_types?.hire_type ?? null,
      amount:
        rate?.amount != null
          ? parseFloat(rate.amount as unknown as string)
          : null,
      booking_status: statusRow?.status ?? null,
    };
  });
}

export const driverBookingsQueryOptions = queryOptions({
  queryKey: ["driver-bookings"],
  queryFn: fetchDriverBookings,
});

// ── Driver Booking Detail ──────────────────────────────────────────────────────

export interface DriverBookingDetail extends DriverBooking {
  licence_class: string | null;
}

async function fetchDriverBookingById(
  id: number,
): Promise<DriverBookingDetail> {
  const { data, error } = await supabase
    .from("driver_bookings")
    .select(
      `id, date_of_hire, time_of_hire, phonenumber, comments, created_at,
       clients(name, supabase_image_url),
       drivers(driver_firstname, driver_lastname, driver_mobile, profile_photo_file),
       drivers_licences(licence_class),
       hire_driver_rates(amount, hire_driver_types(hire_type)),
       hire_driver_statuses(status)`,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  const r = data as Record<string, unknown>;
  const client = r.clients as {
    name: string;
    supabase_image_url: string | null;
  } | null;
  const driver = r.drivers as {
    driver_firstname: string;
    driver_lastname: string;
    driver_mobile: string | null;
    profile_photo_file: string | null;
  } | null;
  const licenceRow = r.drivers_licences as { licence_class: string } | null;
  const rate = r.hire_driver_rates as {
    amount: number;
    hire_driver_types: { hire_type: string } | null;
  } | null;
  const statusRow = r.hire_driver_statuses as { status: string } | null;

  let driverPhoto: string | null = null;
  if (driver?.profile_photo_file) {
    const { data: urlData } = supabase.storage
      .from("driver-photos")
      .getPublicUrl(driver.profile_photo_file);
    driverPhoto = urlData.publicUrl;
  }

  return {
    id: r.id as number,
    date_of_hire: r.date_of_hire as string,
    time_of_hire: (r.time_of_hire as string) ?? null,
    phonenumber: r.phonenumber as string,
    comments: r.comments as string,
    created_at: r.created_at as string,
    client_name: client?.name ?? "Unknown",
    client_avatar: client?.supabase_image_url ?? null,
    driver_name: driver
      ? `${driver.driver_firstname} ${driver.driver_lastname}`
      : null,
    driver_photo: driverPhoto,
    driver_mobile: driver?.driver_mobile ?? null,
    hire_type: rate?.hire_driver_types?.hire_type ?? null,
    amount:
      rate?.amount != null
        ? parseFloat(rate.amount as unknown as string)
        : null,
    required_class: licenceRow?.licence_class ?? null,
    booking_status: statusRow?.status ?? null,
    licence_class: licenceRow?.licence_class ?? null,
  };
}

export function driverBookingDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["driver-booking", id],
    queryFn: () => fetchDriverBookingById(id),
  });
}

export async function deleteDriverBooking(id: number): Promise<void> {
  const { error } = await supabase
    .from("driver_bookings")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function assignDriverToHireBooking(
  bookingId: number,
  driverId: number,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    "assign-hire-driver-function",
    { body: { bookingId, driverId } },
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error as string);
}
