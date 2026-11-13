/**
 * Shared Tailwind class tokens for the Silk Freedom admin.
 *
 * Reference these instead of picking ad hoc padding, radii or colours, so admin
 * surfaces stay visually consistent as they grow — the same single-token-object
 * approach the DrivoraParts admin console uses, rendered here in Silk Freedom's
 * own red (`brand-600`) on the soft grey admin chrome the dashboard already has.
 *
 * Bare `border` is deliberate: Tailwind's preflight defaults the border colour to
 * gray-200, which is what the rest of the admin already relies on.
 */
/**
 * Days of order history the trend panel covers. Lives here so the orders section
 * can test whether the window holds any data without importing the lazy-loaded
 * chart module (and dragging Recharts into the main bundle).
 */
export const ADMIN_TREND_DAYS = 14;

export const adminUi = {
  // --- Layout ---------------------------------------------------------------
  sectionStack: "space-y-5",
  card: "rounded-2xl border bg-white p-6",
  /** Outer wrapper for a full-width section (filter bar + list + pagination). */
  sectionCard: "overflow-hidden rounded-2xl border bg-white",

  // --- Stat cards -----------------------------------------------------------
  statGrid: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
  statCard: "rounded-2xl border bg-white p-5",
  statLabel: "text-sm font-medium text-gray-500",
  statValue: "mt-1 text-2xl font-bold text-gray-900",
  statHint: "mt-1 text-xs text-gray-400",

  // --- Filter bar -----------------------------------------------------------
  filterBar: "flex flex-col gap-3 border-b bg-gray-50 p-4",
  filterRow: "flex flex-col gap-3 sm:flex-row sm:items-center",
  pillRow: "flex flex-wrap gap-2",
  pill: "rounded-lg px-3 py-1.5 text-sm font-medium transition",
  pillActive: "bg-brand-600 text-white",
  pillIdle: "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 hover:text-gray-900",
  pillCount: "ml-1.5 text-xs opacity-70",

  // --- Controls -------------------------------------------------------------
  input:
    "w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200",
  select:
    "rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200",
  /** Compact in-row select used for per-order status changes. */
  selectCompact:
    "w-full rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:opacity-60",
  buttonPrimary:
    "rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60",
  buttonSecondary:
    "rounded-xl border bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40",
  /** Icon-only destructive button (trash). */
  iconButtonDanger:
    "rounded-lg border border-transparent p-1.5 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60",

  // --- Order row cards ------------------------------------------------------
  orderList: "space-y-2 p-4",
  orderRow:
    "flex flex-col items-stretch overflow-hidden rounded-xl border bg-white shadow-sm transition hover:border-brand-300 sm:flex-row",
  orderRowLink:
    "flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
  orderRowActions:
    "flex shrink-0 items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:w-60 sm:border-l sm:border-t-0 sm:bg-transparent sm:px-3",
  orderRef: "font-mono text-sm font-semibold text-gray-900",
  orderMeta: "truncate text-xs text-gray-500",
  orderTime: "text-[11px] text-gray-400",
  orderStatusRow: "flex flex-wrap gap-1.5 sm:justify-end",
  orderTotal: "shrink-0 whitespace-nowrap text-sm font-bold text-gray-900 sm:w-24 sm:text-right",

  // --- Charts ---------------------------------------------------------------
  chartPanel: "rounded-2xl border bg-white p-6",
  chartTitle: "text-base font-semibold text-gray-900",
  chartSubtitle: "mt-0.5 text-xs text-gray-500",
  chartBody: "mt-4 h-72 w-full min-h-0",
  chartSkeleton: "mt-4 h-72 w-full animate-pulse rounded-xl bg-gray-100",

  // --- Misc -----------------------------------------------------------------
  muted: "text-sm text-gray-500",
  emptyState: "p-10 text-center text-sm text-gray-400",
  pagination: "flex flex-wrap items-center justify-center gap-3 border-t p-4",
} as const;
