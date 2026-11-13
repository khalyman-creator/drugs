import {
  CONTROL_LABELS,
  CONTROL_TONE,
  PROCESSING_LABELS,
  PROCESSING_TONE,
  SHIPPING_LABELS,
  SHIPPING_TONE,
  ORDER_STATUS_TONE,
  toneClass,
  type ControlStatus,
  type ProcessingStatus,
  type ShippingStatus,
  type StatusTone,
} from "@/lib/shipping-status";

/**
 * Which status column the value came from. The lanes share vocabulary
 * ("processing" is both a payment state and a processing state), so the lane has
 * to be explicit — a single flat value->tone map would colour them identically.
 */
export type StatusLane = "payment" | "control" | "processing" | "shipping";

/** Turns a raw enum value into a readable label when no label map covers it. */
function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolve(lane: StatusLane, value: string): { label: string; tone: StatusTone } {
  switch (lane) {
    case "control":
      return {
        label: CONTROL_LABELS[value as ControlStatus] ?? humanize(value),
        tone: CONTROL_TONE[value as ControlStatus] ?? "neutral",
      };
    case "processing":
      return {
        label: PROCESSING_LABELS[value as ProcessingStatus] ?? humanize(value),
        tone: PROCESSING_TONE[value as ProcessingStatus] ?? "neutral",
      };
    case "shipping":
      return {
        label: SHIPPING_LABELS[value as ShippingStatus] ?? humanize(value),
        tone: SHIPPING_TONE[value as ShippingStatus] ?? "neutral",
      };
    case "payment":
    default:
      // The legacy `orders.status` column has no label map of its own.
      return { label: humanize(value), tone: ORDER_STATUS_TONE[value] ?? "neutral" };
  }
}

/** Spins while a status is still in progress, so "waiting" never reads as settled. */
export function SpinnerIcon({ className = "h-2.5 w-2.5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4L8.5 12l6.8-6.8a1 1 0 0 1 1.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * A status badge that reads like a CI check: it spins while the status is an
 * in-progress one and settles into a checkmark once it resolves to a positive
 * one. Tone and label both come from `@/lib/shipping-status`, which stays the
 * single source of truth for every status in the app.
 */
export default function StatusPill({
  lane,
  value,
  size = "sm",
}: {
  lane: StatusLane;
  value: string;
  size?: "xs" | "sm";
}) {
  const { label, tone } = resolve(lane, value);
  const textSize = size === "xs" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${textSize} font-semibold ${toneClass(tone)}`}
    >
      {tone === "warning" ? <SpinnerIcon /> : null}
      {tone === "positive" ? <CheckIcon /> : null}
      {label}
    </span>
  );
}
