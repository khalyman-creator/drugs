function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (devFallback && process.env.NODE_ENV !== "production") return devFallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co");
}

export function getSupabaseAnonKey(): string {
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (anon) return anon;
  if (process.env.NODE_ENV !== "production") return "placeholder-anon-key";
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)"
  );
}

export function getSupabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", "placeholder-service-key");
}

export function getSiteUrl(): string {
  return optional("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
}

export function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null;
}

export function getEmailFrom(): string {
  return optional("EMAIL_FROM", "onboarding@resend.dev");
}

export function getAdminEmail(): string {
  return optional("ADMIN_EMAIL", "hcbydrsyckucbktdyrhxji31@gmail.com");
}

export function getNowPaymentsApiKey(): string | null {
  return process.env.NOWPAYMENTS_API_KEY ?? null;
}

export function getNowPaymentsIpnSecret(): string | null {
  return process.env.NOWPAYMENTS_IPN_SECRET ?? null;
}

export function getNowPaymentsButtonIid(): string {
  return process.env.NOWPAYMENTS_BUTTON_IID ?? "4682099423";
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return Boolean(
    url &&
      serviceKey &&
      !url.includes("placeholder") &&
      !serviceKey.includes("placeholder")
  );
}

export function isNowPaymentsConfigured(): boolean {
  return Boolean(getNowPaymentsApiKey());
}

export function isNowPaymentsWebhookConfigured(): boolean {
  return Boolean(getNowPaymentsApiKey() && getNowPaymentsIpnSecret());
}

export function isCheckoutReady(): boolean {
  return isSupabaseConfigured() && isNowPaymentsConfigured();
}
