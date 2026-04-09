import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface CarRentalBooking {
  id: number;
  booking_date: string;
  from_date: string;
  to_date: string;
  period: number | null;
  total_cost: number | null;
  comments: string;
  drivers_licence: string;
  phonenumber: string | null;
  created_at: string;
  // Client
  client_name: string;
  client_avatar: string | null;
  // Vehicle / pricing
  classification: string | null;
  cost_per_day: number | null;
  deposit: number | null;
  // Status
  rental_status: string | null;
}

async function fetchCarRentalBookings(): Promise<CarRentalBooking[]> {
  const { data, error } = await supabase
    .from("car_rentals")
    .select(
      `id, booking_date, from_date, to_date, period, total_cost, comments, drivers_licence, phonenumber, created_at,
       clients(name, supabase_image_url),
       rental_prices(amount, deposit, car_classifications(classification)),
       rental_statuses(status)`,
    )
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const client = r.clients as {
      name: string;
      supabase_image_url: string | null;
    } | null;
    const price = r.rental_prices as {
      amount: number;
      deposit: number | null;
      car_classifications: { classification: string } | null;
    } | null;
    const statusRow = r.rental_statuses as { status: string } | null;

    return {
      id: r.id as number,
      booking_date: r.booking_date as string,
      from_date: r.from_date as string,
      to_date: r.to_date as string,
      period: (r.period as number) ?? null,
      total_cost:
        r.total_cost != null
          ? parseFloat(r.total_cost as unknown as string)
          : null,
      comments: r.comments as string,
      drivers_licence: r.drivers_licence as string,
      phonenumber: (r.phonenumber as string) ?? null,
      created_at: r.created_at as string,
      client_name: client?.name ?? "Unknown",
      client_avatar: client?.supabase_image_url ?? null,
      classification: price?.car_classifications?.classification ?? null,
      cost_per_day:
        price?.amount != null
          ? parseFloat(price.amount as unknown as string)
          : null,
      deposit:
        price?.deposit != null
          ? parseFloat(price.deposit as unknown as string)
          : null,
      rental_status: statusRow?.status ?? null,
    };
  });
}

export const carRentalBookingsQueryOptions = queryOptions({
  queryKey: ["car-rental-bookings"],
  queryFn: fetchCarRentalBookings,
});

export async function deleteCarRentalBooking(id: number): Promise<void> {
  const { error } = await supabase.from("car_rentals").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Single booking detail ──────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): CarRentalBooking {
  const client = row.clients as {
    name: string;
    supabase_image_url: string | null;
  } | null;
  const price = row.rental_prices as {
    amount: number;
    deposit: number | null;
    car_classifications: { classification: string } | null;
  } | null;
  const statusRow = row.rental_statuses as { status: string } | null;

  return {
    id: row.id as number,
    booking_date: row.booking_date as string,
    from_date: row.from_date as string,
    to_date: row.to_date as string,
    period: (row.period as number) ?? null,
    total_cost:
      row.total_cost != null
        ? parseFloat(row.total_cost as unknown as string)
        : null,
    comments: row.comments as string,
    drivers_licence: row.drivers_licence as string,
    phonenumber: (row.phonenumber as string) ?? null,
    created_at: row.created_at as string,
    client_name: client?.name ?? "Unknown",
    client_avatar: client?.supabase_image_url ?? null,
    classification: price?.car_classifications?.classification ?? null,
    cost_per_day:
      price?.amount != null
        ? parseFloat(price.amount as unknown as string)
        : null,
    deposit:
      price?.deposit != null
        ? parseFloat(price.deposit as unknown as string)
        : null,
    rental_status: statusRow?.status ?? null,
  };
}

async function fetchCarRentalBookingById(
  id: number,
): Promise<CarRentalBooking> {
  const { data, error } = await supabase
    .from("car_rentals")
    .select(
      `id, booking_date, from_date, to_date, period, total_cost, comments, drivers_licence, phonenumber, created_at,
       clients(name, supabase_image_url),
       rental_prices(amount, deposit, car_classifications(classification)),
       rental_statuses(status)`,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export function carRentalBookingDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["car-rental-booking", id],
    queryFn: () => fetchCarRentalBookingById(id),
  });
}
