import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface CarListingImage {
  id: number;
  image: string;
  image_type: string | null;
}

export interface CarListingSummary {
  id: number;
  vehicle_model: string;
  year: string | null;
  mileage: number | null;
  condition: string | null;
  fuel_type: string | null;
  transmission: string | null;
  availability: string | null;
  created_at: string;
  client_name: string;
  client_phonenumber: string | null;
  client_avatar: string | null;
  cover_image: string | null;
}

export interface CarListingDetail extends CarListingSummary {
  owner_address: string | null;
  owner_id_number: string | null;
  owner_phone_number: string | null;
  images: CarListingImage[];
}

const LISTING_SELECT = `id, vehicle_model, mileage, year, fuel_type, transmission, condition, availability, owner_address, owner_id_number, owner_phone_number, created_at,
       clients(name, phonenumber, supabase_image_url),
       car_listing_images(id, image, image_type)`;

interface ClientJoin {
  name: string | null;
  phonenumber: string | null;
  supabase_image_url: string | null;
}

function mapSummaryRow(row: Record<string, unknown>): CarListingSummary {
  const client = row.clients as ClientJoin | null;
  const images = (row.car_listing_images as CarListingImage[] | null) ?? [];
  const front = images.find(
    (img) => (img.image_type ?? "").toLowerCase() === "front",
  );

  return {
    id: row.id as number,
    vehicle_model: row.vehicle_model as string,
    year: (row.year as string) ?? null,
    mileage:
      row.mileage != null ? parseFloat(row.mileage as unknown as string) : null,
    condition: (row.condition as string) ?? null,
    fuel_type: (row.fuel_type as string) ?? null,
    transmission: (row.transmission as string) ?? null,
    availability: (row.availability as string) ?? null,
    created_at: row.created_at as string,
    client_name: client?.name ?? "Unknown",
    client_phonenumber: client?.phonenumber ?? null,
    client_avatar: client?.supabase_image_url ?? null,
    cover_image: front?.image ?? images[0]?.image ?? null,
  };
}

async function fetchCarListings(): Promise<CarListingSummary[]> {
  const { data, error } = await supabase
    .from("car_listings")
    .select(LISTING_SELECT)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    mapSummaryRow(row as Record<string, unknown>),
  );
}

export const carListingsQueryOptions = queryOptions({
  queryKey: ["car-listings"],
  queryFn: fetchCarListings,
});

function mapDetailRow(row: Record<string, unknown>): CarListingDetail {
  const summary = mapSummaryRow(row);
  const images = (row.car_listing_images as CarListingImage[] | null) ?? [];

  return {
    ...summary,
    owner_address: (row.owner_address as string) ?? null,
    owner_id_number: (row.owner_id_number as string) ?? null,
    owner_phone_number: (row.owner_phone_number as string) ?? null,
    images,
  };
}

async function fetchCarListingById(id: number): Promise<CarListingDetail> {
  const { data, error } = await supabase
    .from("car_listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return mapDetailRow(data as Record<string, unknown>);
}

export function carListingDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["car-listing", id],
    queryFn: () => fetchCarListingById(id),
  });
}
