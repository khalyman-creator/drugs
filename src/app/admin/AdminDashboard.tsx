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

  const [settings, setSettings] = useState(initialSettings);
  const [sections, setSections] = useState(initialSections);

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [creatingSection, setCreatingSection] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionDeleteArmed, setSectionDeleteArmed] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setMessage("Site settings saved!");
      router.refresh();
    } else {
      setMessage("Failed to save settings");
    }
    setSaving(false);
  }

  function startEditSection(section: Section) {
    setCreatingSection(false);
    setEditingSection(section);
    setSectionName(section.name);
    setSectionDeleteArmed(false);
    setMessage("");
  }

  function startNewSection() {
    setEditingSection(null);
    setCreatingSection(true);
    setSectionName("");
    setSectionDeleteArmed(false);
    setMessage("");
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
      body: JSON.stringify({ id: editingSection.id, name: sectionName }),
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

      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

      {tab === "site" && (
        <form onSubmit={saveSettings} className="max-w-2xl space-y-8 rounded-2xl border bg-white p-6">
          <div>
            <h2 className="font-semibold">Site Settings</h2>
            <p className="text-sm text-gray-500">Edit your whole homepage, header, footer, and contact info</p>
          </div>

          <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">General</legend>
            {(
              [
                ["store_name", "Store Name"],
                ["tagline", "Tagline"],
                ["products_page_title", "Shop Page Title"],
                ["products_page_subtitle", "Shop Page Subtitle"],
                ["footer_text", "Footer Copyright Text"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2.5"
                  required
                />
              </div>
            ))}
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Hero Banner</legend>
            {(
              [
                ["hero_title", "Hero Title"],
                ["hero_subtitle", "Hero Subtitle"],
                ["hero_button_text", "Button Text"],
                ["hero_image_url", "Hero Background Image URL"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2.5"
                  required
                />
              </div>
            ))}
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">About Section</legend>
            <div>
              <label className="mb-1 block text-sm font-medium">About Title</label>
              <input
                value={settings.about_title}
                onChange={(e) => setSettings({ ...settings, about_title: e.target.value })}
                className="w-full rounded-xl border px-4 py-2.5"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">About Text</label>
              <textarea
                value={settings.about_text}
                onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                rows={4}
                className="w-full rounded-xl border px-4 py-2.5"
                required
              />
            </div>
          </fieldset>

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
                  required
                />
              </div>
            ))}
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-medium text-brand-800">Testimonials</legend>
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
                  required
                />
                <textarea
                  value={String(settings[`testimonial_${n}_text` as keyof SiteSettings] ?? "")}
                  onChange={(e) =>
                    setSettings({ ...settings, [`testimonial_${n}_text`]: e.target.value })
                  }
                  placeholder="Review text"
                  rows={2}
                  className="w-full rounded-xl border px-4 py-2.5"
                  required
                />
              </div>
            ))}
          </fieldset>

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

          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save All Site Settings"}
          </button>
        </form>
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
                  <li key={section.id}>
                    <button
                      onClick={() => startEditSection(section)}
                      className={`flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 ${
                        editingSection?.id === section.id ? "bg-brand-50" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium">{section.name}</p>
                        <p className="text-sm text-gray-500">{count} products</p>
                      </div>
                      <span className="text-xs text-brand-600">Edit</span>
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
