import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Product, SectionWithProducts } from "@/lib/types";
import { getAllSections } from "./supabase-sections";

function slugify(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id}`;
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProductsBySection(): Promise<SectionWithProducts[]> {
  const [sections, products] = await Promise.all([
    getAllSections(),
    getAllProducts(),
  ]);

  return sections.map((section) => ({
    ...section,
    products: products
      .filter((p) => p.section_id === section.id)
      .sort((a, b) => a.id - b.id),
  }));
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  const all = await getAllProducts();
  if (!q) return all;

  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
  );
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return (data as Product) ?? undefined;
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Product) ?? undefined;
}

export async function createProduct(data: {
  name: string;
  description: string;
  image_url: string;
  price: number;
  section_id: number;
}): Promise<Product> {
  const supabase = getSupabaseAdmin();

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      name: data.name,
      description: data.description,
      image_url: data.image_url,
      price: data.price,
      section_id: data.section_id,
    })
    .select("*")
    .single();

  if (error) throw error;

  const slug = slugify(data.name, inserted.id);
  const { data: withSlug, error: slugError } = await supabase
    .from("products")
    .update({ slug })
    .eq("id", inserted.id)
    .select("*")
    .single();

  if (slugError) throw slugError;
  return withSlug as Product;
}

export async function updateProduct(
  id: number,
  data: {
    name: string;
    description: string;
    image_url: string;
    price?: number;
    section_id?: number;
  }
): Promise<Product | undefined> {
  const supabase = getSupabaseAdmin();
  const slug = slugify(data.name, id);

  const { data: updated, error } = await supabase
    .from("products")
    .update({
      name: data.name,
      slug,
      description: data.description,
      image_url: data.image_url,
      ...(data.price != null ? { price: data.price } : {}),
      ...(data.section_id != null ? { section_id: data.section_id } : {}),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (updated as Product) ?? undefined;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from("products")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw error;
  return (count ?? 0) > 0;
}
