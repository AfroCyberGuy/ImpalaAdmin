import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface ShuttleTrip {
  id: number;
  trip_date: string;
  trip_time: string | null;
  trip_cost: number | null;
  trip_total_distance: number | null;
  pickup_address: string | null;
  destination_address: string | null;
  created_at: string;
  // Client
  client_name: string;
  client_phone: string | null;
  client_avatar: string | null;
  // Trip status
  trip_status: string | null;
  // Payment
  payment_status: string | null;
  payment_method: string | null;
  // City
  shuttle_city: string | null;
}

async function fetchShuttleTrips(): Promise<ShuttleTrip[]> {
  const { data, error } = await supabase
    .from("shuttle_bookings")
    .select(
      `id, trip_date, trip_time, trip_cost, trip_total_distance,
       pickup_address, destination_address, created_at,
       clients(name, phonenumber, supabase_image_url),
       trip_statuses(status),
       payments(status, payment_method),
       shuttle_cities(cities(city_name))`,
    )
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const client = r.clients as {
      name: string;
      phonenumber: string | null;
      supabase_image_url: string | null;
    } | null;
    const tripStatus = r.trip_statuses as { status: string } | null;
    const payment = r.payments as {
      status: string;
      payment_method: string | null;
    } | null;
    const shuttleCity = r.shuttle_cities as {
      cities: { city_name: string } | null;
    } | null;

    return {
      id: r.id as number,
      trip_date: (r.trip_date as string) ?? "",
      trip_time: (r.trip_time as string) ?? null,
      trip_cost: r.trip_cost != null ? parseFloat(r.trip_cost as string) : null,
      trip_total_distance:
        r.trip_total_distance != null
          ? parseFloat(r.trip_total_distance as string)
          : null,
      pickup_address: (r.pickup_address as string) ?? null,
      destination_address: (r.destination_address as string) ?? null,
      created_at: r.created_at as string,
      client_name: client?.name ?? "Unknown",
      client_phone: client?.phonenumber ?? null,
      client_avatar: client?.supabase_image_url ?? null,
      trip_status: tripStatus?.status ?? null,
      payment_status: payment?.status ?? null,
      payment_method: payment?.payment_method ?? null,
      shuttle_city: shuttleCity?.cities?.city_name ?? null,
    };
  });
}

export const shuttleTripsQueryOptions = queryOptions({
  queryKey: ["shuttle-trips"],
  queryFn: fetchShuttleTrips,
});

// ── Detail ─────────────────────────────────────────────────────────────────────

export interface ShuttleTripDetail extends ShuttleTrip {
  pick_up_latitude: number;
  pick_up_longitude: number;
  drop_off_latitude: number;
  drop_off_longitude: number;
  trip_encoded_points: string;
  // Driver
  driver_name: string | null;
  driver_mobile: string | null;
  driver_photo: string | null;
  // Payment detail
  payment_reference: string | null;
  amount_invoiced: number | null;
  amount_paid: number | null;
  payment_currency: string | null;
}

async function fetchShuttleTripById(id: number): Promise<ShuttleTripDetail> {
  const { data, error } = await supabase
    .from("shuttle_bookings")
    .select(
      `id, trip_date, trip_time, trip_cost, trip_total_distance,
       pickup_address, destination_address, created_at,
       pick_up_latitude, pick_up_longitude, drop_off_latitude, drop_off_longitude,
       trip_encoded_points,
       clients(name, phonenumber, supabase_image_url),
       trip_statuses(status),
       payments(status, payment_method, reference, amount_invoiced, amount_paid, currency),
       shuttle_cities(cities(city_name)),
       drivers(driver_firstname, driver_lastname, driver_mobile, profile_photo_file)`,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  const r = data as Record<string, unknown>;
  const client = r.clients as {
    name: string;
    phonenumber: string | null;
    supabase_image_url: string | null;
  } | null;
  const tripStatus = r.trip_statuses as { status: string } | null;
  const payment = r.payments as {
    status: string;
    payment_method: string | null;
    reference: string | null;
    amount_invoiced: number | null;
    amount_paid: number | null;
    currency: string | null;
  } | null;
  const shuttleCity = r.shuttle_cities as {
    cities: { city_name: string } | null;
  } | null;
  const driver = r.drivers as {
    driver_firstname: string;
    driver_lastname: string;
    driver_mobile: string | null;
    profile_photo_file: string | null;
  } | null;

  let driverPhoto: string | null = null;
  if (driver?.profile_photo_file) {
    const { data: urlData } = supabase.storage
      .from("driver-photos")
      .getPublicUrl(driver.profile_photo_file);
    driverPhoto = urlData.publicUrl;
  }

  return {
    id: r.id as number,
    trip_date: (r.trip_date as string) ?? "",
    trip_time: (r.trip_time as string) ?? null,
    trip_cost: r.trip_cost != null ? parseFloat(r.trip_cost as string) : null,
    trip_total_distance:
      r.trip_total_distance != null
        ? parseFloat(r.trip_total_distance as string)
        : null,
    pickup_address: (r.pickup_address as string) ?? null,
    destination_address: (r.destination_address as string) ?? null,
    created_at: r.created_at as string,
    pick_up_latitude: parseFloat(r.pick_up_latitude as string),
    pick_up_longitude: parseFloat(r.pick_up_longitude as string),
    drop_off_latitude: parseFloat(r.drop_off_latitude as string),
    drop_off_longitude: parseFloat(r.drop_off_longitude as string),
    trip_encoded_points: (r.trip_encoded_points as string) ?? "",
    client_name: client?.name ?? "Unknown",
    client_phone: client?.phonenumber ?? null,
    client_avatar: client?.supabase_image_url ?? null,
    trip_status: tripStatus?.status ?? null,
    payment_status: payment?.status ?? null,
    payment_method: payment?.payment_method ?? null,
    shuttle_city: shuttleCity?.cities?.city_name ?? null,
    driver_name: driver
      ? `${driver.driver_firstname} ${driver.driver_lastname}`
      : null,
    driver_mobile: driver?.driver_mobile ?? null,
    driver_photo: driverPhoto,
    payment_reference: payment?.reference ?? null,
    amount_invoiced:
      payment?.amount_invoiced != null
        ? parseFloat(payment.amount_invoiced as unknown as string)
        : null,
    amount_paid:
      payment?.amount_paid != null
        ? parseFloat(payment.amount_paid as unknown as string)
        : null,
    payment_currency: payment?.currency ?? null,
  };
}

export function shuttleTripDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["shuttle-trip", id],
    queryFn: () => fetchShuttleTripById(id),
  });
}

// ── Assign driver ──────────────────────────────────────────────────────────────

export async function assignDriverToShuttleTrip(
  tripId: number,
  driverId: number,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    "assign-shuttle-driver-function",
    { body: { tripId, driverId } },
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error as string);
}
