import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Password-only login — checked against every stored hash, not tied to a username. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("admin_users").select("password_hash");

  if (error) throw error;
  if (!data || data.length === 0) return false;

  return data.some((row) => bcrypt.compareSync(password, row.password_hash));
}
