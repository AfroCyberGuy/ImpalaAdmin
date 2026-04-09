import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface CabRate {
  id: number;
  car_classification_id: number;
  amount: number;
  created_at: string;
  updated_at: string | null;
  car_classifications: { classification: string };
}

async function fetchCabRates(): Promise<CabRate[]> {
  const { data, error } = await supabase
    .from("cab_rates")
    .select(
      "id, car_classification_id, amount, created_at, updated_at, car_classifications(classification)",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CabRate[];
}

export const cabRatesQueryOptions = queryOptions({
  queryKey: ["cab_rates"],
  queryFn: fetchCabRates,
});

export interface AddCabRatePayload {
  car_classification_id: number;
  amount: number;
}

export async function addCabRate(payload: AddCabRatePayload): Promise<void> {
  const { error } = await supabase.from("cab_rates").insert(payload);
  if (error) throw new Error(error.message);
}

export interface UpdateCabRatePayload {
  amount: number;
}

export async function updateCabRate(
  id: number,
  payload: UpdateCabRatePayload,
): Promise<void> {
  const { error } = await supabase
    .from("cab_rates")
    .update(payload)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCabRate(id: number): Promise<void> {
  const { error } = await supabase.from("cab_rates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
