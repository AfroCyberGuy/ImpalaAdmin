import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface CarClassification {
  id: number;
  classification: string;
  created_at: string;
}

async function fetchCarClassifications(): Promise<CarClassification[]> {
  const { data, error } = await supabase
    .from("car_classifications")
    .select("id, classification, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export const carClassificationsQueryOptions = queryOptions({
  queryKey: ["car_classifications"],
  queryFn: fetchCarClassifications,
});

export async function addCarClassification(
  classification: string,
): Promise<void> {
  const { error } = await supabase
    .from("car_classifications")
    .insert({ classification });
  if (error) throw new Error(error.message);
}

export async function updateCarClassification(
  id: number,
  classification: string,
): Promise<void> {
  const { error } = await supabase
    .from("car_classifications")
    .update({ classification })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCarClassification(id: number): Promise<void> {
  const { error } = await supabase
    .from("car_classifications")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
