import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface RentalPrice {
  id: number;
  car_classification_id: number;
  amount: number;
  deposit: number | null;
  refundable_deposit: number | null;
  created_at: string;
  updated_at: string | null;
  car_classifications: { classification: string };
}

async function fetchRentalPrices(): Promise<RentalPrice[]> {
  const { data, error } = await supabase
    .from("rental_prices")
    .select(
      "id, car_classification_id, amount, deposit, refundable_deposit, created_at, updated_at, car_classifications(classification)",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as RentalPrice[];
}

export const rentalPricesQueryOptions = queryOptions({
  queryKey: ["rental_prices"],
  queryFn: fetchRentalPrices,
});

export interface AddRentalPricePayload {
  car_classification_id: number;
  amount: number;
  deposit: number | null;
  refundable_deposit: number | null;
}

export async function addRentalPrice(
  payload: AddRentalPricePayload,
): Promise<void> {
  const { error } = await supabase.from("rental_prices").insert(payload);
  if (error) throw new Error(error.message);
}

export interface UpdateRentalPricePayload {
  amount: number;
  deposit: number | null;
  refundable_deposit: number | null;
}

export async function updateRentalPrice(
  id: number,
  payload: UpdateRentalPricePayload,
): Promise<void> {
  const { error } = await supabase
    .from("rental_prices")
    .update(payload)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRentalPrice(id: number): Promise<void> {
  const { error } = await supabase.from("rental_prices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
