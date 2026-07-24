import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Product, SectionWithProducts } from "@/lib/types";
import { getAllSections, getSectionById } from "./supabase-sections";

function slugify(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id}`;
}

export async function getAllProducts(
  opts: { includeInactive?: boolean } = {}
): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  const products = (data ?? []) as Product[];
  if (opts.includeInactive) return products;

  const activeSectionIds = new Set(
    (await getAllSections({ includeInactive: false })).map((s) => s.id)
  );
  return products.filter((p) => p.is_active && activeSectionIds.has(p.section_id));
}

export async function getProductsBySection(
  opts: { includeInactive?: boolean } = {}
): Promise<SectionWithProducts[]> {
  const [sections, products] = await Promise.all([
    getAllSections(opts),
    getAllProducts(opts),
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

export async function getProductBySlug(
  slug: string,
  opts: { includeInactive?: boolean } = {}
): Promise<Product | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  const product = (data as Product) ?? undefined;
  if (!product || opts.includeInactive) return product;
  if (!product.is_active) return undefined;

  const section = await getSectionById(product.section_id);
  if (!section || !section.is_active) return undefined;

  return product;
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
  details?: string;
  image_url: string;
  price: number;
  section_id: number;
  is_active?: boolean;
  allow_custom_quantity?: boolean;
}): Promise<Product> {
  const supabase = getSupabaseAdmin();

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      name: data.name,
      description: data.description,
      details: data.details ?? "",
      image_url: data.image_url,
      price: data.price,
      section_id: data.section_id,
      is_active: data.is_active ?? true,
      allow_custom_quantity: data.allow_custom_quantity ?? true,
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
    name?: string;
    description?: string;
    details?: string;
    image_url?: string;
    price?: number;
    section_id?: number;
    is_active?: boolean;
    allow_custom_quantity?: boolean;
  }
): Promise<Product | undefined> {
  const supabase = getSupabaseAdmin();

  const { data: updated, error } = await supabase
    .from("products")
    .update({
      ...(data.name != null ? { name: data.name, slug: slugify(data.name, id) } : {}),
      ...(data.description != null ? { description: data.description } : {}),
      ...(data.details != null ? { details: data.details } : {}),
      ...(data.image_url != null ? { image_url: data.image_url } : {}),
      ...(data.price != null ? { price: data.price } : {}),
      ...(data.section_id != null ? { section_id: data.section_id } : {}),
      ...(data.is_active != null ? { is_active: data.is_active } : {}),
      ...(data.allow_custom_quantity != null
        ? { allow_custom_quantity: data.allow_custom_quantity }
        : {}),
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
