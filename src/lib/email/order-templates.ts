import { formatPrice } from "@/lib/format";
import type { OrderItemRecord, OrderWithDetails } from "@/lib/db/supabase-orders";
import { escapeHtml } from "./escape-html";
import { formatEmailDate, formatOrderReference } from "./order-ref";

const BRAND = "#16a34a";
const BRAND_DARK = "#15803d";

type LineItem = Pick<OrderItemRecord, "name" | "quantity" | "price" | "category">;

function lineItemsTable(items: LineItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">
          ${escapeHtml(item.name)}
          ${item.category ? `<br /><span style="color:#6b7280;font-size:12px;">${escapeHtml(item.category)}</span>` : ""}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;font-size:14px;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;font-size:14px;font-weight:600;">${formatPrice(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">
      <thead>
        <tr>
          <th align="left" style="padding:8px 0;border-bottom:2px solid #111827;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Item</th>
          <th align="center" style="padding:8px 8px;border-bottom:2px solid #111827;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
          <th align="right" style="padding:8px 0;border-bottom:2px solid #111827;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function totalsBlock(subtotal: number, shipping: number, total: number): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td style="padding:4px 0;color:#6b7280;font-size:14px;">Subtotal</td>
        <td align="right" style="padding:4px 0;color:#374151;font-size:14px;">${formatPrice(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b7280;font-size:14px;">Shipping</td>
        <td align="right" style="padding:4px 0;color:#374151;font-size:14px;">${shipping > 0 ? formatPrice(shipping) : "Free"}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;color:#111827;font-size:16px;font-weight:700;border-top:2px solid #111827;">Total Due</td>
        <td align="right" style="padding:12px 0 0;color:${BRAND_DARK};font-size:20px;font-weight:700;border-top:2px solid #111827;">${formatPrice(total)}</td>
      </tr>
    </table>`;
}

function emailShell(input: {
  title: string;
  badge: string;
  badgeColor: string;
  body: string;
  orderRef: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${BRAND};padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.02em;">RawDrop</div>
                    <div style="color:#dcfce7;font-size:13px;margin-top:4px;">Official order documentation</div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:${input.badgeColor};color:#ffffff;font-size:11px;font-weight:700;padding:6px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(input.badge)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;color:#111827;font-size:28px;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(input.title)}</h1>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Order ${escapeHtml(input.orderRef)}</p>
              ${input.body}
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
                RawDrop · Secure crypto checkout via NOWPayments<br />
                Questions? Reply to this email or visit our contact page.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildInvoiceEmailHtml(input: {
  order: OrderWithDetails;
  paymentUrl: string;
  transactionId?: string;
}): string {
  const order = input.order;
  const customer = order.customer;
  const orderRef = formatOrderReference(order.id);
  const date = formatEmailDate(order.created_at);

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;vertical-align:top;">
                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Bill To</div>
                <div style="font-size:15px;font-weight:600;color:#111827;">${escapeHtml(customer?.full_name ?? "Customer")}</div>
                <div style="font-size:14px;color:#374151;margin-top:4px;">${escapeHtml(customer?.email ?? "")}</div>
              </td>
              <td style="width:50%;vertical-align:top;text-align:right;">
                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Invoice Date</div>
                <div style="font-size:14px;color:#111827;">${escapeHtml(date)}</div>
                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-top:12px;margin-bottom:4px;">Status</div>
                <div style="font-size:14px;color:#b45309;font-weight:600;">Payment Pending</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${customer?.shipping_address ? `
    <p style="margin:0 0 20px;color:#374151;font-size:14px;">
      <strong style="color:#111827;">Ship to:</strong><br />
      ${escapeHtml(customer.shipping_address)}
    </p>` : ""}

    ${lineItemsTable(order.items)}
    ${totalsBlock(Number(order.subtotal), Number(order.shipping), Number(order.total))}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(input.paymentUrl)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 32px;border-radius:8px;">Complete Payment</a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
      This invoice was generated when you placed your order. Complete payment via our secure NOWPayments checkout.
      ${input.transactionId ? `<br />Payment reference: <strong>${escapeHtml(input.transactionId)}</strong>` : ""}
    </p>`;

  return emailShell({
    title: "Invoice",
    badge: "Invoice",
    badgeColor: "#b45309",
    body,
    orderRef,
  });
}

export function buildReceiptEmailHtml(input: {
  order: OrderWithDetails;
  transactionId?: string;
  paidAt?: string;
}): string {
  const order = input.order;
  const customer = order.customer;
  const orderRef = formatOrderReference(order.id);
  const paidDate = input.paidAt ? formatEmailDate(input.paidAt) : formatEmailDate(order.updated_at);

  const body = `
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <div style="font-size:32px;line-height:1;margin-bottom:8px;">✓</div>
      <div style="font-size:18px;font-weight:700;color:#065f46;">Payment Received</div>
      <div style="font-size:14px;color:#047857;margin-top:4px;">Thank you for your order, ${escapeHtml(customer?.full_name ?? "Customer")}!</div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;vertical-align:top;">
                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Paid By</div>
                <div style="font-size:15px;font-weight:600;color:#111827;">${escapeHtml(customer?.full_name ?? "Customer")}</div>
                <div style="font-size:14px;color:#374151;margin-top:4px;">${escapeHtml(customer?.email ?? "")}</div>
              </td>
              <td style="width:50%;vertical-align:top;text-align:right;">
                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Payment Date</div>
                <div style="font-size:14px;color:#111827;">${escapeHtml(paidDate)}</div>
                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-top:12px;margin-bottom:4px;">Status</div>
                <div style="font-size:14px;color:${BRAND_DARK};font-weight:600;">Paid in Full</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${customer?.shipping_address ? `
    <p style="margin:0 0 20px;color:#374151;font-size:14px;">
      <strong style="color:#111827;">Shipping address:</strong><br />
      ${escapeHtml(customer.shipping_address)}
    </p>` : ""}

    ${lineItemsTable(order.items)}
    ${totalsBlock(Number(order.subtotal), Number(order.shipping), Number(order.total))}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:16px 20px;font-size:13px;color:#374151;line-height:1.8;">
          <strong style="color:#111827;">Payment confirmation</strong><br />
          Method: Crypto (NOWPayments)<br />
          ${input.transactionId ? `Transaction ID: <strong>${escapeHtml(input.transactionId)}</strong><br />` : ""}
          Amount paid: <strong>${formatPrice(Number(order.total))}</strong>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
      This receipt confirms your payment has been received and your order is being processed.
      Keep this email for your records.
    </p>`;

  return emailShell({
    title: "Payment Receipt",
    badge: "Receipt",
    badgeColor: BRAND_DARK,
    body,
    orderRef,
  });
}
