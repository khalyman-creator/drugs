import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_users")
    .select("password_hash")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;

  return bcrypt.compareSync(password, data.password_hash);
}
