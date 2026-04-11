import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

// Maps Laravel polymorphic model names → human-readable payment type labels
const PAYABLE_TYPE_LABELS: Record<string, string> = {
  "App\\Models\\SupabaseModels\\SupabaseTaxiBooking": "Cab Payment",
  "App\\Models\\SupabaseModels\\SupabaseShuttleBooking": "Shuttle Payment",
  "App\\Models\\SupabaseModels\\SupabaseCarRental": "Car Rental Payment",
  "App\\Models\\SupabaseModels\\SupabaseHireDriver": "Hire Driver Payment",
};

export function resolvePayableType(payableType: string): string {
  return PAYABLE_TYPE_LABELS[payableType] ?? payableType;
}

export interface Payment {
  id: number;
  payable_type: string;
  payable_type_label: string;
  payable_id: number;
  client_id: number;
  reference: string | null;
  paynow_reference: string | null;
  amount_invoiced: number | null;
  amount_paid: number | null;
  payment_method: string | null;
  payment_method_reference: string | null;
  status: string;
  currency: string | null;
  created_at: string;
  // Joined from clients
  client_name: string;
  client_phone: string | null;
  client_avatar: string | null;
}

async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      `id, payable_type, payable_id, client_id, reference, paynow_reference,
       amount_invoiced, amount_paid, payment_method, payment_method_reference,
       status, currency, created_at,
       clients(name, phonenumber, supabase_image_url)`,
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

    const payableType = (r.payable_type as string) ?? "";

    return {
      id: r.id as number,
      payable_type: payableType,
      payable_type_label: resolvePayableType(payableType),
      payable_id: r.payable_id as number,
      client_id: r.client_id as number,
      reference: (r.reference as string) ?? null,
      paynow_reference: (r.paynow_reference as string) ?? null,
      amount_invoiced:
        r.amount_invoiced != null
          ? parseFloat(r.amount_invoiced as string)
          : null,
      amount_paid:
        r.amount_paid != null ? parseFloat(r.amount_paid as string) : null,
      payment_method: (r.payment_method as string) ?? null,
      payment_method_reference: (r.payment_method_reference as string) ?? null,
      status: (r.status as string) ?? "pending",
      currency: (r.currency as string) ?? null,
      created_at: r.created_at as string,
      client_name: client?.name ?? "Unknown",
      client_phone: client?.phonenumber ?? null,
      client_avatar: client?.supabase_image_url ?? null,
    };
  });
}

export const paymentsQueryOptions = queryOptions({
  queryKey: ["payments"],
  queryFn: fetchPayments,
});
