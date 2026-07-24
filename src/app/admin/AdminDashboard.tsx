"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, Section, SiteSettings } from "@/lib/types";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  totalFormatted: string;
  status: string;
  created_at: string;
};

type Tab = "site" | "sections" | "orders";

export function AdminDashboard({
  products,
  sections: initialSections,
  settings: initialSettings,
  orders,
}: {
  products: Product[];
  sections: Section[];
  settings: SiteSettings;
  orders: OrderRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("site");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [sectionMessages, setSectionMessages] = useState<Record<string, string>>({});

  const [settings, setSettings] = useState(initialSettings);
  const [sections, setSections] = useState(initialSections);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState("");

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [creatingSection, setCreatingSection] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionActive, setSectionActive] = useState(true);
  const [sectionDeleteArmed, setSectionDeleteArmed] = useState(false);
  const [togglingSectionId, setTogglingSectionId] = useState<number | null>(null);

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setHeroUploading(true);
    setHeroUploadError("");
    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body });
    if (res.ok) {
      const { url } = await res.json();
      setSettings((prev) => ({ ...prev, hero_image_url: url }));
    } else {
      const data = await res.json().catch(() => ({}));
      setHeroUploadError(data.error || "Upload failed");
    }
    setHeroUploading(false);
  }

  async function saveFields(sectionKey: string, patch: Partial<SiteSettings>, e?: React.FormEvent) {
    e?.preventDefault();
    setSavingSection(sectionKey);
    setSectionMessages((prev) => ({ ...prev, [sectionKey]: "" }));
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setSectionMessages((prev) => ({ ...prev, [sectionKey]: "Saved!" }));
      router.refresh();
    } else {
      setSectionMessages((prev) => ({ ...prev, [sectionKey]: "Failed to save" }));
    }
    setSavingSection(null);
  }

  function saveRow(sectionKey: string) {
    const sectionMessage = sectionMessages[sectionKey];
    return (
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={savingSection === sectionKey}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {savingSection === sectionKey ? "Saving..." : "Save"}
        </button>
        {sectionMessage && (
          <span
            className={`text-sm ${
              sectionMessage === "Saved!" ? "text-green-600" : "text-red-600"
            }`}
          >
            {sectionMessage}
          </span>
        )}
      </div>
    );
  }

  function startEditSection(section: Section) {
    setCreatingSection(false);
    setEditingSection(section);
    setSectionName(section.name);
    setSectionActive(section.is_active);
    setSectionDeleteArmed(false);
    setMessage("");
  }

  function startNewSection() {
    setEditingSection(null);
    setCreatingSection(true);
    setSectionName("");
    setSectionActive(true);
    setSectionDeleteArmed(false);
    setMessage("");
  }

  async function toggleSectionActive(section: Section) {
    setTogglingSectionId(section.id);
    setMessage("");
    const res = await fetch("/api/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: section.id, is_active: !section.is_active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (editingSection?.id === updated.id) {
        setEditingSection(updated);
        setSectionActive(updated.is_active);
      }
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || `Failed to update "${section.name}"`);
    }
    setTogglingSectionId(null);
  }

  function cancelSectionForm() {
    setEditingSection(null);
    setCreatingSection(false);
    setSectionDeleteArmed(false);
  }

  async function saveSection(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (creatingSection) {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sectionName }),
      });
      if (res.ok) {
        const created = await res.json();
        setSections((prev) => [...prev, created]);
        setCreatingSection(false);
        setEditingSection(created);
        setMessage("Section added!");
        router.refresh();
      } else {
        setMessage("Failed to add section");
      }
      setSaving(false);
      return;
    }

    if (!editingSection) {
      setSaving(false);
      return;
    }

    const res = await fetch("/api/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingSection.id, name: sectionName, is_active: sectionActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditingSection(updated);
      setMessage("Section saved!");
      router.refresh();
    } else {
      setMessage("Failed to save section");
    }
    setSaving(false);
  }

  async function removeSection() {
    if (!editingSection) return;
    const count = products.filter((p) => p.section_id === editingSection.id).length;
    if (count > 0) {
      setMessage(`Can't delete "${editingSection.name}" — it still has ${count} product${count === 1 ? "" : "s"}. Move or delete them first.`);
      return;
    }

    if (!sectionDeleteArmed) {
      setSectionDeleteArmed(true);
      return;
    }

    setSaving(true);
    setMessage("");
    const res = await fetch("/api/sections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingSection.id }),
    });
    if (res.ok) {
      setSections((prev) => prev.filter((s) => s.id !== editingSection.id));
      setEditingSection(null);
      setSectionDeleteArmed(false);
      setMessage("Section deleted.");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Failed to delete section");
      setSectionDeleteArmed(false);
    }
    setSaving(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "site", label: "Site" },
    { id: "sections", label: `Sections (${sections.length})` },
    { id: "orders", label: `Orders (${orders.length})` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">Edit your whole site from here — site, sections, products, orders</p>
        </div>
        <div className="flex gap-3">
          <Link href="/products" className="text-sm text-brand-600 hover:underline">
            View Store
          </Link>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:underline">
            Logout
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
        <Link
          href="/admin/products"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          Products ({products.length})
        </Link>
      </div>

      {message && (
        <p
          className={`mb-4 text-sm ${
            message.startsWith("Failed") || message.startsWith("Can't")
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      {tab === "site" && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="font-semibold">Homepage Layout</h2>
            <p className="text-sm text-gray-500">
              Everything from the header down to the footer, in page order. Each section saves on
              its own — changes go live the moment you hit that section&apos;s Save button, no
              redeploy needed.
            </p>
          </div>

          <form
            onSubmit={(e) =>
              saveFields(
                "header",
                {
                  store_name: settings.store_name,
                  tagline: settings.tagline,
                  products_page_title: settings.products_page_title,
                  products_page_subtitle: settings.products_page_subtitle,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Header &amp; General</legend>
            {(
              [
                ["store_name", "Store Name (shown in header + browser tab)"],
                ["tagline", "Tagline"],
                ["products_page_title", "Shop Page Title"],
                ["products_page_subtitle", "Shop Page Subtitle"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2.5"
                />
              </div>
            ))}
            </fieldset>
            {saveRow("header")}
          </form>

          <form
            onSubmit={(e) =>
              saveFields(
                "hero",
                {
                  hero_title: settings.hero_title,
                  hero_subtitle: settings.hero_subtitle,
                  hero_button_text: settings.hero_button_text,
                  hero_image_url: settings.hero_image_url,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Hero Banner</legend>
            {(
              [
                ["hero_title", "Hero Title"],
                ["hero_subtitle", "Hero Subtitle"],
                ["hero_button_text", "Button Text"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2.5"
                />
              </div>
            ))}

            <div>
              <label className="mb-1 block text-sm font-medium">Hero Photo</label>
              <p className="mb-2 text-xs text-gray-400">
                The tape-corner frame and color overlay are part of the design, not the image
                itself — swap the photo and that styling stays exactly as it is.
              </p>
              {settings.hero_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.hero_image_url}
                  alt=""
                  className="mb-2 h-32 w-full rounded-lg border object-cover"
                />
              )}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
                  {heroUploading ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleHeroImageUpload}
                    disabled={heroUploading}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-gray-400">or paste a URL below</span>
              </div>
              {heroUploadError && <p className="mt-1 text-xs text-red-600">{heroUploadError}</p>}
              <input
                value={settings.hero_image_url}
                onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
                className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm"
                placeholder="https://..."
              />
            </div>
            </fieldset>
            {saveRow("hero")}
          </form>

          <form
            onSubmit={(e) =>
              saveFields(
                "featured",
                {
                  featured_products_title: settings.featured_products_title,
                  featured_products_subtitle: settings.featured_products_subtitle,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Featured Products</legend>
            {(
              [
                ["featured_products_title", "Section Title"],
                ["featured_products_subtitle", "Section Subtitle"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2.5"
                />
              </div>
            ))}
            </fieldset>
            {saveRow("featured")}
          </form>

          <form
            onSubmit={(e) =>
              saveFields(
                "about",
                {
                  about_title: settings.about_title,
                  about_text: settings.about_text,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">About Section</legend>
            <div>
              <label className="mb-1 block text-sm font-medium">About Title</label>
              <input
                value={settings.about_title}
                onChange={(e) => setSettings({ ...settings, about_title: e.target.value })}
                className="w-full rounded-xl border px-4 py-2.5"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">About Text</label>
              <textarea
                value={settings.about_text}
                onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                rows={4}
                className="w-full rounded-xl border px-4 py-2.5"
              />
            </div>
            </fieldset>
            {saveRow("about")}
          </form>

          <form
            onSubmit={(e) =>
              saveFields(
                "testimonials",
                {
                  testimonials_title: settings.testimonials_title,
                  testimonials_subtitle: settings.testimonials_subtitle,
                  testimonial_1_name: settings.testimonial_1_name,
                  testimonial_1_text: settings.testimonial_1_text,
                  testimonial_2_name: settings.testimonial_2_name,
                  testimonial_2_text: settings.testimonial_2_text,
                  testimonial_3_name: settings.testimonial_3_name,
                  testimonial_3_text: settings.testimonial_3_text,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Testimonials</legend>
            {(
              [
                ["testimonials_title", "Section Title"],
                ["testimonials_subtitle", "Section Subtitle"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2.5"
                />
              </div>
            ))}
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-medium">Testimonial {n}</p>
                <input
                  value={String(settings[`testimonial_${n}_name` as keyof SiteSettings] ?? "")}
                  onChange={(e) =>
                    setSettings({ ...settings, [`testimonial_${n}_name`]: e.target.value })
                  }
                  placeholder="Customer name"
                  className="w-full rounded-xl border px-4 py-2.5"
                />
                <textarea
                  value={String(settings[`testimonial_${n}_text` as keyof SiteSettings] ?? "")}
                  onChange={(e) =>
                    setSettings({ ...settings, [`testimonial_${n}_text`]: e.target.value })
                  }
                  placeholder="Review text"
                  rows={2}
                  className="w-full rounded-xl border px-4 py-2.5"
                />
              </div>
            ))}
            </fieldset>
            {saveRow("testimonials")}
          </form>

          <form
            onSubmit={(e) => saveFields("footer", { footer_text: settings.footer_text }, e)}
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Footer</legend>
            <div>
              <label className="mb-1 block text-sm font-medium">Footer Copyright Text</label>
              <input
                value={settings.footer_text}
                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                className="w-full rounded-xl border px-4 py-2.5"
              />
            </div>
            </fieldset>
            {saveRow("footer")}
          </form>

          <form
            onSubmit={(e) =>
              saveFields(
                "policies",
                {
                  shipping_policy_text: settings.shipping_policy_text,
                  refund_policy_text: settings.refund_policy_text,
                  privacy_policy_text: settings.privacy_policy_text,
                  terms_of_service_text: settings.terms_of_service_text,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Policies</legend>
            <p className="text-xs text-gray-400">
              Start a line with <code className="rounded bg-gray-100 px-1">## </code> to make it a
              subheading. Leave a blank line between paragraphs.
            </p>
            {(
              [
                ["shipping_policy_text", "Shipping Policy (/shipping)"],
                ["refund_policy_text", "Refund Policy (/refunds)"],
                ["privacy_policy_text", "Privacy Policy (/privacy)"],
                ["terms_of_service_text", "Terms of Service (/terms)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <textarea
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  rows={10}
                  className="w-full rounded-xl border px-4 py-2.5 font-mono text-sm"
                />
              </div>
            ))}
            </fieldset>
            {saveRow("policies")}
          </form>

          <form
            onSubmit={(e) =>
              saveFields(
                "contact",
                {
                  contact_email: settings.contact_email,
                  contact_phone: settings.contact_phone,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Contact</legend>
            {(
              [
                ["contact_email", "Internal email (not shown on site)"],
                ["contact_phone", "Phone"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2.5"
                />
              </div>
            ))}
            </fieldset>
            {saveRow("contact")}
          </form>

          <form
            onSubmit={(e) =>
              saveFields(
                "pricingTiers",
                {
                  gram_28g_label: settings.gram_28g_label,
                  gram_28g_price: settings.gram_28g_price,
                  gram_qtr_label: settings.gram_qtr_label,
                  gram_qtr_price: settings.gram_qtr_price,
                  gram_half_label: settings.gram_half_label,
                  gram_half_price: settings.gram_half_price,
                  gram_1lb_label: settings.gram_1lb_label,
                  gram_1lb_price: settings.gram_1lb_price,
                  button_8_label: settings.button_8_label,
                  button_8_price: settings.button_8_price,
                  button_16_label: settings.button_16_label,
                  button_16_price: settings.button_16_price,
                  button_32_label: settings.button_32_label,
                  button_32_price: settings.button_32_price,
                  button_64_label: settings.button_64_label,
                  button_64_price: settings.button_64_price,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Pricing Tiers (defaults for new products)</legend>
            <p className="text-xs text-gray-400">
              Each product now has its own editable pricing options — edit those from the product&apos;s
              page under Products. These values only act as the starting point pre-filled when you add a
              new product to a weight-based (sections 1–6) or button-based (sections 7–8) section; changing
              them here no longer affects any existing product.
            </p>

            <p className="text-sm font-medium text-gray-700">Weight tiers</p>
            {(
              [
                ["gram_28g_label", "gram_28g_price", "Tier 1 label", "Tier 1 price"],
                ["gram_qtr_label", "gram_qtr_price", "Tier 2 label", "Tier 2 price"],
                ["gram_half_label", "gram_half_price", "Tier 3 label", "Tier 3 price"],
                ["gram_1lb_label", "gram_1lb_price", "Tier 4 label", "Tier 4 price"],
              ] as const
            ).map(([labelKey, priceKey, labelPlaceholder, pricePlaceholder]) => (
              <div key={labelKey} className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {labelPlaceholder}
                  </label>
                  <input
                    value={settings[labelKey]}
                    onChange={(e) => setSettings({ ...settings, [labelKey]: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2.5"
                  />
                </div>
                <div className="w-32">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {pricePlaceholder}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={settings[priceKey]}
                    onChange={(e) =>
                      setSettings({ ...settings, [priceKey]: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border px-4 py-2.5"
                  />
                </div>
              </div>
            ))}

            <p className="pt-2 text-sm font-medium text-gray-700">Button tiers</p>
            {(
              [
                ["button_8_label", "button_8_price", "Tier 1 label", "Tier 1 price"],
                ["button_16_label", "button_16_price", "Tier 2 label", "Tier 2 price"],
                ["button_32_label", "button_32_price", "Tier 3 label", "Tier 3 price"],
                ["button_64_label", "button_64_price", "Tier 4 label", "Tier 4 price"],
              ] as const
            ).map(([labelKey, priceKey, labelPlaceholder, pricePlaceholder]) => (
              <div key={labelKey} className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {labelPlaceholder}
                  </label>
                  <input
                    value={settings[labelKey]}
                    onChange={(e) => setSettings({ ...settings, [labelKey]: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2.5"
                  />
                </div>
                <div className="w-32">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {pricePlaceholder}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={settings[priceKey]}
                    onChange={(e) =>
                      setSettings({ ...settings, [priceKey]: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border px-4 py-2.5"
                  />
                </div>
              </div>
            ))}
            </fieldset>
            {saveRow("pricingTiers")}
          </form>

          <form
            onSubmit={(e) =>
              saveFields(
                "bitcoin",
                {
                  btc_payment_enabled: settings.btc_payment_enabled,
                  btc_wallet_address: settings.btc_wallet_address,
                },
                e
              )
            }
            className="space-y-4 rounded-2xl border bg-white p-6"
          >
            <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Bitcoin Payment (optional)</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.btc_payment_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, btc_payment_enabled: e.target.checked })
                }
              />
              Enable BTC at checkout
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium">BTC Wallet Address</label>
              <input
                value={settings.btc_wallet_address}
                onChange={(e) =>
                  setSettings({ ...settings, btc_wallet_address: e.target.value })
                }
                className="w-full rounded-xl border px-4 py-2.5 font-mono text-sm"
                placeholder="Paste your BTC address here"
              />
            </div>
            </fieldset>
            {saveRow("bitcoin")}
          </form>
        </div>
      )}

      {tab === "sections" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white">
            <div className="border-b p-4">
              <button
                type="button"
                onClick={startNewSection}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                + Add New Section
              </button>
            </div>
            <ul className="divide-y">
              {sections.map((section) => {
                const count = products.filter((p) => p.section_id === section.id).length;
                return (
                  <li key={section.id} className="flex items-center gap-2 p-2">
                    <button
                      onClick={() => startEditSection(section)}
                      className={`flex flex-1 items-center justify-between rounded-xl p-2 text-left hover:bg-gray-50 ${
                        editingSection?.id === section.id ? "bg-brand-50" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium">{section.name}</p>
                        <p className="text-sm text-gray-500">{count} products</p>
                      </div>
                      <span className="text-xs text-brand-600">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSectionActive(section)}
                      disabled={togglingSectionId === section.id}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-60 ${
                        section.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {togglingSectionId === section.id
                        ? "..."
                        : section.is_active
                          ? "Online"
                          : "Offline"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            {editingSection || creatingSection ? (
              <form onSubmit={saveSection} className="space-y-4">
                <h2 className="font-semibold">{creatingSection ? "Add New Section" : "Edit Section"}</h2>
                <div>
                  <label className="mb-1 block text-sm font-medium">Section Name</label>
                  <input
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5"
                    placeholder="e.g. Seasonal Picks"
                    required
                  />
                </div>
                {!creatingSection && editingSection && (
                  <p className="text-xs text-gray-400">
                    {products.filter((p) => p.section_id === editingSection.id).length} products in
                    this section
                  </p>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sectionActive}
                    onChange={(e) => setSectionActive(e.target.checked)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  Online (visible on storefront)
                </label>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : creatingSection ? "Add Section" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelSectionForm}
                    className="rounded-xl border px-4 py-2.5 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {!creatingSection && editingSection && (
                    <button
                      type="button"
                      onClick={removeSection}
                      disabled={saving}
                      className={`rounded-xl border px-4 py-2.5 disabled:opacity-60 ${
                        sectionDeleteArmed
                          ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {sectionDeleteArmed ? "Click again to confirm" : "Delete"}
                    </button>
                  )}
                  {sectionDeleteArmed && (
                    <button
                      type="button"
                      onClick={() => setSectionDeleteArmed(false)}
                      className="rounded-xl border px-4 py-2.5 text-gray-600 hover:bg-gray-50"
                    >
                      Never mind
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                ← Pick a section to rename, or add a new one
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="overflow-hidden rounded-2xl border bg-white">
          {orders.length === 0 ? (
            <p className="p-8 text-center text-gray-400">No orders yet</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-4 font-medium">Order</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs">{o.order_number}</td>
                    <td className="p-4">
                      <p>{o.customer_name}</p>
                      <p className="text-xs text-gray-400">{o.customer_email}</p>
                    </td>
                    <td className="p-4">{o.totalFormatted}</td>
                    <td className="p-4 capitalize">{o.status}</td>
                    <td className="p-4">
                      <Link
                        href={`/success?orderId=${o.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
