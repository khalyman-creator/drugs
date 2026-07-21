import { NextResponse } from "next/server";
import {
  getSiteUrl,
  isCheckoutReady,
  isNowPaymentsConfigured,
  isNowPaymentsWebhookConfigured,
  isSupabaseConfigured,
} from "@/lib/env";

export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  const nowpaymentsConfigured = isNowPaymentsConfigured();

  return NextResponse.json({
    checkoutReady: isCheckoutReady(),
    supabaseConfigured,
    nowpaymentsConfigured,
    nowpaymentsWebhookConfigured: isNowPaymentsWebhookConfigured(),
    siteUrl: getSiteUrl(),
    brand: "RawDrop",
  });
}
