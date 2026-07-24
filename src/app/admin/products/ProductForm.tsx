"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product, ProductPricingOption, Section, SiteSettings } from "@/lib/types";
import { getPricingMode } from "@/lib/pricing";

type PricingOptionRow = {
  id?: number;
  label: string;
  price: number;
  unit_quantity: number | null;
  is_active: boolean;
};

function toRows(options: ProductPricingOption[]): PricingOptionRow[] {
  return options.map((o) => ({
    id: o.id,
    label: o.label,
    price: o.price,
    unit_quantity: o.unit_quantity,
    is_active: o.is_active,
  }));
}

export function ProductForm({
  mode,
  product,
  sections,
  pricingOptions,
  siteDefaults,
}: {
  mode: "create" | "edit";
  product?: Product;
  sections: Section[];
  pricingOptions?: ProductPricingOption[];
  siteDefaults?: SiteSettings;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(product);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    details: product?.details ?? "",
    image_url: product?.image_url ?? "",
    price: product?.price ?? 200,
    section_id: product?.section_id ?? sections[0]?.id ?? 1,
    is_active: product?.is_active ?? true,
    allow_custom_quantity: product?.allow_custom_quantity ?? true,
  });
  const [rows, setRows] = useState<PricingOptionRow[]>(() => toRows(pricingOptions ?? []));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleteArmed, setDeleteArmed] = useState(false);

  const pricingMode = getPricingMode(form.section_id);

  // For a brand-new gram/button product, prefill from the site-wide defaults
  // so the admin isn't retyping 4 tiers — fully editable/removable before saving.
  useEffect(() => {
    if (mode !== "create" || !siteDefaults || rows.length > 0) return;
    if (pricingMode === "gram") {
      setRows([
        { label: siteDefaults.gram_28g_label, price: siteDefaults.gram_28g_price, unit_quantity: 28, is_active: true },
        { label: siteDefaults.gram_qtr_label, price: siteDefaults.gram_qtr_price, unit_quantity: 113, is_active: true },
        { label: siteDefaults.gram_half_label, price: siteDefaults.gram_half_price, unit_quantity: 227, is_active: true },
        { label: siteDefaults.gram_1lb_label, price: siteDefaults.gram_1lb_price, unit_quantity: 454, is_active: true },
      ]);
    } else if (pricingMode === "button") {
      setRows([
        { label: siteDefaults.button_8_label, price: siteDefaults.button_8_price, unit_quantity: 8, is_active: true },
        { label: siteDefaults.button_16_label, price: siteDefaults.button_16_price, unit_quantity: 16, is_active: true },
        { label: siteDefaults.button_32_label, price: siteDefaults.button_32_price, unit_quantity: 32, is_active: true },
        { label: siteDefaults.button_64_label, price: siteDefaults.button_64_price, unit_quantity: 64, is_active: true },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pricingMode, siteDefaults]);

  function addPricingOption() {
    setRows((prev) => [...prev, { label: "", price: 0, unit_quantity: null, is_active: true }]);
  }

  function updatePricingOption(index: number, patch: Partial<PricingOptionRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removePricingOption(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError("");
    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body });
    if (res.ok) {
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, image_url: url }));
    } else {
      const data = await res.json().catch(() => ({}));
      setUploadError(data.error || "Upload failed");
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const body = {
      ...form,
      pricing_options: pricingMode === "standard" ? [] : rows,
    };

    if (mode === "create") {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created = await res.json();
        router.push(`/admin/products/${created.id}`);
        router.refresh();
      } else {
        setMessage("Failed to add product");
        setSaving(false);
      }
      return;
    }

    if (!current) {
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/products/${current.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setCurrent(updated);
      setMessage("Product saved!");
      router.refresh();
    } else {
      setMessage("Failed to save product");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!current) return;

    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }

    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/products/${current.slug}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setMessage("Failed to delete product");
      setDeleteArmed(false);
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/products" className="text-sm text-brand-600 hover:underline">
            ← Back to Products
          </Link>
          <h1 className="mt-2 text-2xl font-bold">
            {mode === "create" ? "Add New Product" : `Edit Product #${current?.id}`}
          </h1>
        </div>
        {mode === "edit" && current && (
          <Link
            href={`/product/${current.slug}`}
            target="_blank"
            className="text-sm text-gray-500 hover:underline"
          >
            View on Store ↗
          </Link>
        )}
      </div>

      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-2xl border bg-white p-6">
        <label
          className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 ${
            form.is_active ? "border-green-200 bg-green-50" : "border-gray-300 bg-gray-50"
          }`}
        >
          <span>
            <span className="block text-sm font-semibold text-gray-900">
              {form.is_active ? "Online" : "Offline"}
            </span>
            <span className="block text-xs text-gray-500">
              {form.is_active
                ? "Visible and purchasable on the storefront"
                : "Hidden from the storefront — customers can't see or buy it"}
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-5 w-5 accent-brand-600"
          />
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border px-4 py-2.5"
            placeholder="e.g. Classic Cotton Tee"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full rounded-xl border px-4 py-2.5"
            placeholder="Describe the product..."
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Details (optional)</label>
          <textarea
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            rows={4}
            className="w-full rounded-xl border px-4 py-2.5"
            placeholder="Specs, materials, care instructions — shown as its own section on the product page"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Product Image</label>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-brand-400 hover:text-brand-700">
              {uploading ? "Uploading..." : "Upload Photo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <span className="text-xs text-gray-400">JPG, PNG, WEBP, or GIF — max 5MB</span>
          </div>
          {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}

          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm"
            placeholder="...or paste an image URL"
            required
          />
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.image_url}
              alt="Preview"
              className="mt-2 h-32 w-32 rounded-xl object-cover"
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Section</label>
          <select
            value={form.section_id}
            onChange={(e) => setForm({ ...form, section_id: Number(e.target.value) })}
            className="w-full rounded-xl border px-4 py-2.5"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {!s.is_active ? " (Offline)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Price</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="w-full rounded-xl border px-4 py-2.5"
            min={0}
            required
          />
          {pricingMode !== "standard" && (
            <p className="mt-1 text-xs text-amber-600">
              Heads up: this section uses fixed {pricingMode === "gram" ? "weight" : "button"}-based
              pricing on the storefront — this price field won&apos;t change what customers see. Use
              the Pricing Options below instead.
            </p>
          )}
        </div>

        {pricingMode !== "standard" && (
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Pricing Options</span>
              <button
                type="button"
                onClick={addPricingOption}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                + Add option
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Exactly what customers see in the quantity dropdown on this product&apos;s page.
              Uncheck &quot;Enabled&quot; to hide an option from the storefront without deleting it.
            </p>

            <div className="space-y-2">
              {rows.length === 0 && (
                <p className="text-xs text-gray-400">No pricing options yet — add one below.</p>
              )}
              {rows.map((row, i) => (
                <div key={row.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2">
                  <input
                    value={row.label}
                    onChange={(e) => updatePricingOption(i, { label: e.target.value })}
                    placeholder="Label (e.g. 1/4 lb)"
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={row.price}
                    onChange={(e) => updatePricingOption(i, { price: Number(e.target.value) })}
                    className="w-28 rounded-lg border px-3 py-2 text-sm"
                    required
                  />
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) => updatePricingOption(i, { is_active: e.target.checked })}
                      className="h-4 w-4 accent-brand-600"
                    />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() => removePricingOption(i)}
                    className="rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <label className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.allow_custom_quantity}
                onChange={(e) => setForm({ ...form, allow_custom_quantity: e.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
              Allow customers to enter a custom amount
            </label>
          </div>
        )}

        {mode === "edit" && current && (
          <p className="text-xs text-gray-400">
            Link: /product/{current.slug} (updates when you rename)
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : mode === "create" ? "Add Product" : "Save"}
          </button>
          <Link
            href="/admin/products"
            className="rounded-xl border px-4 py-2.5 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
          {mode === "edit" && current && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className={`rounded-xl border px-4 py-2.5 disabled:opacity-60 ${
                deleteArmed
                  ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                  : "border-red-200 text-red-600 hover:bg-red-50"
              }`}
            >
              {deleteArmed ? "Click again to confirm" : "Delete"}
            </button>
          )}
          {deleteArmed && (
            <button
              type="button"
              onClick={() => setDeleteArmed(false)}
              className="rounded-xl border px-4 py-2.5 text-gray-600 hover:bg-gray-50"
            >
              Never mind
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
