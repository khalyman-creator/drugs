import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SiteSettings } from "@/lib/types";

const SETTINGS_ROW_ID = 1;

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "site_settings row is missing — run supabase/migrations/002_catalog_and_admin.sql"
    );
  }

  const { id: _id, updated_at: _updatedAt, ...settings } = data;
  return settings as SiteSettings;
}

export async function updateSiteSettings(
  patch: Partial<SiteSettings>
): Promise<SiteSettings> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", SETTINGS_ROW_ID)
    .select("*")
    .single();

  if (error) throw error;
  const { id: _id, updated_at: _updatedAt, ...settings } = data;
  return settings as SiteSettings;
}
