import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Review } from "@/lib/types";

export async function getApprovedReviews(): Promise<Review[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function getAllReviewsForAdmin(): Promise<Review[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function createReview(input: { name: string; comment: string }): Promise<Review> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .insert({ name: input.name, comment: input.comment, is_approved: false })
    .select("*")
    .single();

  if (error) throw error;
  return data as Review;
}

export async function setReviewApproved(
  id: number,
  approved: boolean
): Promise<Review | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .update({ is_approved: approved })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as Review) ?? undefined;
}

export async function deleteReview(id: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from("reviews")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw error;
  return (count ?? 0) > 0;
}
