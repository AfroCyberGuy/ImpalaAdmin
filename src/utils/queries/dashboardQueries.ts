import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

async function fetchMonthlyBookings(year: number) {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const [cab, shuttle, carRental, driver] = await Promise.all([
    supabase
      .from("taxi_bookings")
      .select("created_at")
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("shuttle_bookings")
      .select("created_at")
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("car_rentals")
      .select("created_at")
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("driver_bookings")
      .select("created_at")
      .gte("created_at", from)
      .lte("created_at", to),
  ]);

  const countByMonth = (rows: { created_at: string }[] | null) => {
    const counts = Array(12).fill(0);
    for (const row of rows ?? []) {
      const m = new Date(row.created_at).getMonth();
      counts[m]++;
    }
    return counts;
  };

  const cabCounts = countByMonth(cab.data);
  const shuttleCounts = countByMonth(shuttle.data);
  const carRentalCounts = countByMonth(carRental.data);
  const driverCounts = countByMonth(driver.data);

  return MONTHS.map((month, i) => ({
    month,
    cab: cabCounts[i],
    shuttle: shuttleCounts[i],
    carRental: carRentalCounts[i],
    driver: driverCounts[i],
  }));
}

export const monthlyBookingsQueryOptions = (year: number) =>
  queryOptions({
    queryKey: ["dashboard", "monthly-bookings", year],
    queryFn: () => fetchMonthlyBookings(year),
  });

async function fetchBookingCounts() {
  const [cab, shuttle, carRental, driver] = await Promise.all([
    supabase.from("taxi_bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("shuttle_bookings")
      .select("*", { count: "exact", head: true }),
    supabase.from("car_rentals").select("*", { count: "exact", head: true }),
    supabase
      .from("driver_bookings")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    cab: cab.count ?? 0,
    shuttle: shuttle.count ?? 0,
    carRental: carRental.count ?? 0,
    driver: driver.count ?? 0,
  };
}

export const bookingCountsQueryOptions = queryOptions({
  queryKey: ["dashboard", "booking-counts"],
  queryFn: fetchBookingCounts,
});

export interface BookingPin {
  id: number;
  type: "cab" | "shuttle";
  clientName: string;
  clientAvatar: string | null;
  pickupAddress: string;
  destinationAddress: string;
  lat: number;
  lng: number;
  status: string;
  tripDate: string;
  tripCost: number | null;
}

async function fetchBookingPins(): Promise<BookingPin[]> {
  const [taxi, shuttle] = await Promise.all([
    supabase
      .from("taxi_bookings")
      .select(
        "id, pickup_address, destination_address, pick_up_latitude, pick_up_longitude, trip_date, trip_cost, clients(name, supabase_image_url), trip_statuses(status)",
      )
      .not("pick_up_latitude", "is", null)
      .not("pick_up_longitude", "is", null),
    supabase
      .from("shuttle_bookings")
      .select(
        "id, pickup_address, destination_address, pick_up_latitude, pick_up_longitude, trip_date, trip_cost, clients(name, supabase_image_url), trip_statuses(status)",
      )
      .not("pick_up_latitude", "is", null)
      .not("pick_up_longitude", "is", null),
  ]);

  const toPin = (
    row: Record<string, unknown>,
    type: "cab" | "shuttle",
  ): BookingPin => {
    const client = row.clients as {
      name: string;
      supabase_image_url: string | null;
    } | null;
    const statusObj = row.trip_statuses as { status: string } | null;
    return {
      id: row.id as number,
      type,
      clientName: client?.name ?? "Unknown",
      clientAvatar: client?.supabase_image_url ?? null,
      pickupAddress: (row.pickup_address as string) ?? "",
      destinationAddress: (row.destination_address as string) ?? "",
      lat: parseFloat(row.pick_up_latitude as string),
      lng: parseFloat(row.pick_up_longitude as string),
      status: statusObj?.status ?? "Unknown",
      tripDate: (row.trip_date as string) ?? "",
      tripCost:
        row.trip_cost != null ? parseFloat(row.trip_cost as string) : null,
    };
  };

  const taxiPins = (taxi.data ?? []).map((r) =>
    toPin(r as Record<string, unknown>, "cab"),
  );
  const shuttlePins = (shuttle.data ?? []).map((r) =>
    toPin(r as Record<string, unknown>, "shuttle"),
  );

  return [...taxiPins, ...shuttlePins];
}

export const bookingPinsQueryOptions = queryOptions({
  queryKey: ["dashboard", "booking-pins"],
  queryFn: fetchBookingPins,
});
