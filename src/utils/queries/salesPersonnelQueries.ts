import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface SalesPerson {
  id: number;
  fullname: string;
  phone: string;
  created_at: string;
}

async function fetchSalesPersonnel(): Promise<SalesPerson[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("id, fullname, phone, created_at")
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SalesPerson[];
}

export async function createSalesPerson(
  fullname: string,
  phone: string,
): Promise<SalesPerson> {
  const { data, error } = await supabase
    .from("sales")
    .insert({ fullname, phone })
    .select("id, fullname, phone, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as SalesPerson;
}

export async function updateSalesPerson(
  id: number,
  fullname: string,
  phone: string,
): Promise<SalesPerson> {
  const { data, error } = await supabase
    .from("sales")
    .update({ fullname, phone })
    .eq("id", id)
    .select("id, fullname, phone, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as SalesPerson;
}

export async function deleteSalesPerson(id: number): Promise<void> {
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export const salesPersonnelQueryOptions = queryOptions({
  queryKey: ["sales_personnel"],
  queryFn: fetchSalesPersonnel,
});
