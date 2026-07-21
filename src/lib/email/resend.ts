import { getEmailFrom, getResendApiKey } from "@/lib/env";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(getResendApiKey());
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  const from = getEmailFrom();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: input.replyTo,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      return { ok: false, error: data?.message ?? "Could not send email." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send email. Try again later." };
  }
}
