import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Section } from "@/lib/types";

export async function getAllSections(
  opts: { includeInactive?: boolean } = {}
): Promise<Section[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  const sections = (data ?? []) as Section[];
  return opts.includeInactive ? sections : sections.filter((s) => s.is_active);
}

export async function getSectionById(id: number): Promise<Section | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Section) ?? undefined;
}

export async function createSection(name: string): Promise<Section> {
  const supabase = getSupabaseAdmin();
  const { data: last } = await supabase
    .from("sections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("sections")
    .insert({ name, sort_order })
    .select("*")
    .single();

  if (error) throw error;
  return data as Section;
}

export async function updateSection(
  id: number,
  data: { name?: string; is_active?: boolean }
): Promise<Section | undefined> {
  const supabase = getSupabaseAdmin();
  const { data: updated, error } = await supabase
    .from("sections")
    .update({
      ...(data.name != null ? { name: data.name } : {}),
      ...(data.is_active != null ? { is_active: data.is_active } : {}),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (updated as Section) ?? undefined;
}

export async function deleteSection(
  id: number
): Promise<{ ok: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("section_id", id);

  if (countError) throw countError;
  if (count && count > 0) {
    return { ok: false, reason: "Move or delete its products first" };
  }

  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}
