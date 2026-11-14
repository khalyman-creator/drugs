import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AgeGate } from "@/components/AgeGate";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { AGE_COOKIE, AGE_COOKIE_VALUE } from "@/lib/age-gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Age check",
  robots: { index: false, follow: false },
};

/**
 * The age gate lives on its own route, outside the (site) group, so it is not
 * gated by the storefront layout.
 *
 * Keeping it a separate page rather than rendering it inside the storefront
 * layout matters: the layout redirects here instead of returning the gate in
 * place, which interrupts rendering and means no product data reaches the
 * response. Returning the gate in place still let the page underneath execute
 * and serialise its output into the RSC payload.
 */
export default async function AgeCheckPage() {
  const cookieStore = await cookies();
  if (cookieStore.get(AGE_COOKIE)?.value === AGE_COOKIE_VALUE) {
    redirect("/");
  }

  const settings = await getSiteSettings();
  return <AgeGate storeName={settings.store_name} />;
}
