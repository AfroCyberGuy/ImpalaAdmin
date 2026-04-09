import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

// ── Cities ─────────────────────────────────────────────────────────────────────

export interface City {
  id: number;
  city_name: string;
  created_at: string;
}

async function fetchCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, city_name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export const citiesQueryOptions = queryOptions({
  queryKey: ["cities"],
  queryFn: fetchCities,
});

export async function addCity(city_name: string): Promise<void> {
  const { error } = await supabase.from("cities").insert({ city_name });
  if (error) throw new Error(error.message);
}

export async function updateCity(id: number, city_name: string): Promise<void> {
  const { error } = await supabase
    .from("cities")
    .update({ city_name })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCity(id: number): Promise<void> {
  const { error } = await supabase.from("cities").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Shuttle Cities (rates) ─────────────────────────────────────────────────────

export interface ShuttleCity {
  id: number;
  car_classification_id: number;
  city_id: number;
  price_per_km: number;
  created_at: string;
  updated_at: string | null;
  car_classifications: { classification: string };
  cities: { city_name: string };
}

async function fetchShuttleCities(): Promise<ShuttleCity[]> {
  const { data, error } = await supabase
    .from("shuttle_cities")
    .select(
      "id, car_classification_id, city_id, price_per_km, created_at, updated_at, car_classifications(classification), cities(city_name)",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ShuttleCity[];
}

export const shuttleCitiesQueryOptions = queryOptions({
  queryKey: ["shuttle_cities"],
  queryFn: fetchShuttleCities,
});

export interface AddShuttleCityPayload {
  car_classification_id: number;
  city_id: number;
  price_per_km: number;
}

export async function addShuttleCity(
  payload: AddShuttleCityPayload,
): Promise<void> {
  const { error } = await supabase.from("shuttle_cities").insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateShuttleCity(
  id: number,
  payload: { price_per_km: number },
): Promise<void> {
  const { error } = await supabase
    .from("shuttle_cities")
    .update(payload)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteShuttleCity(id: number): Promise<void> {
  const { error } = await supabase.from("shuttle_cities").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
