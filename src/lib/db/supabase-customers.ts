import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type CustomerRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
};

export async function createCustomer(input: {
  fullName: string;
  email: string;
  phone?: string;
  shippingAddress?: string;
}): Promise<CustomerRecord> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      shipping_address: input.shippingAddress ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as CustomerRecord;
}
