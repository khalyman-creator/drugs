"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product, Section } from "@/lib/types";
import { getPricingMode } from "@/lib/pricing";

export function ProductForm({
  mode,
  product,
  sections,
}: {
  mode: "create" | "edit";
  product?: Product;
  sections: Section[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(product);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    image_url: product?.image_url ?? "",
    price: product?.price ?? 200,
    section_id: product?.section_id ?? sections[0]?.id ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleteArmed, setDeleteArmed] = useState(false);

  const pricingMode = getPricingMode(form.section_id);

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

    if (mode === "create") {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      body: JSON.stringify(form),
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
              pricing on the storefront — this price field won&apos;t change what customers see. Edit
              the pricing tiers in{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5">src/lib/pricing.ts</code> instead.
            </p>
          )}
        </div>

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
