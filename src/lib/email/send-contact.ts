import { getAdminEmail, getEmailFrom } from "@/lib/env";
import { escapeHtml } from "./escape-html";
import { sendEmail } from "./resend";

export async function sendContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const html = `
    <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
    <hr />
    <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
  `;

  const result = await sendEmail({
    to: getAdminEmail(),
    subject: `[RawDrop Contact] ${input.subject}`,
    html,
    replyTo: input.email,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export { getEmailFrom };
