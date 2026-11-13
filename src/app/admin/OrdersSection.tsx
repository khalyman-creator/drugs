"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CONTROL_STATUSES,
  CONTROL_LABELS,
  PROCESSING_STATUSES,
  PROCESSING_LABELS,
  SHIPPING_STATUSES,
  SHIPPING_LABELS,
} from "@/lib/shipping-status";
import { formatPrice } from "@/lib/format";
import StatusPill from "@/components/admin/StatusPill";
import { ADMIN_TREND_DAYS, adminUi } from "@/components/admin/admin-ui";

export type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  totalFormatted: string;
  status: string;
  control_status: string;
  processing_status: string;
  shipping_status: string;
  created_at: string;
};

const PAGE_SIZE = 25;

/**
 * Recharts is browser-only here, so it never enters the Cloudflare Worker
 * bundle — `ssr: false` is allowed because this importer is a client component.
 */
const OrdersTrendChart = dynamic(() => import("@/components/admin/OrdersTrendChart"), {
  ssr: false,
  loading: () => (
    <section className={adminUi.chartPanel}>
      <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
      <div className={adminUi.chartSkeleton} />
    </section>
  ),
});

/** Payment states this store's code actually sets, in the order an admin cares about. */
const BASE_PAYMENT_FILTERS = [
  { id: "pending", label: "Awaiting payment" },
  { id: "paid", label: "Paid" },
  { id: "failed", label: "Failed" },
] as const;

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={adminUi.statCard}>
      <p className={adminUi.statLabel}>{label}</p>
      <p className={adminUi.statValue}>{value}</p>
      {hint ? <p className={adminUi.statHint}>{hint}</p> : null}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.5 6h13M8 3.5h4M7 6l.6 10h4.8L13 6M8.5 8.5v5M11.5 8.5v5" />
    </svg>
  );
}

export default function OrdersSection({
  orders,
  savingOrderField,
  deletingOrderId,
  onStatusChange,
  onDelete,
}: {
  orders: OrderRow[];
  savingOrderField: string | null;
  deletingOrderId: string | null;
  onStatusChange: (
    orderId: string,
    field: "control-status" | "processing-status",
    bodyKey: "control_status" | "processing_status",
    value: string
  ) => void;
  onDelete: (id: string, orderNumber: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [controlFilter, setControlFilter] = useState<string>("all");
  const [shippingFilter, setShippingFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Every figure below is derived from the orders actually in the database —
  // nothing is estimated or seeded.
  const stats = useMemo(() => {
    let paidCount = 0;
    let paidRevenue = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let onHold = 0;
    let exceptions = 0;

    for (const order of orders) {
      const amount = Number(order.total) || 0;
      if (order.status === "paid") {
        paidCount += 1;
        paidRevenue += amount;
      } else if (order.status === "pending") {
        pendingCount += 1;
        pendingAmount += amount;
      }
      if (order.control_status === "on_hold") onHold += 1;
      if (order.shipping_status === "delivery_exception") exceptions += 1;
    }

    return { paidCount, paidRevenue, pendingCount, pendingAmount, onHold, exceptions };
  }, [orders]);

  const paymentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of orders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }
    return counts;
  }, [orders]);

  /** Any legacy payment status present in the data that isn't one of the three above. */
  const paymentFilters = useMemo(() => {
    const known = new Set(BASE_PAYMENT_FILTERS.map((f) => f.id as string));
    const extras = Array.from(new Set(orders.map((o) => o.status)))
      .filter((status) => !known.has(status))
      .sort()
      .map((status) => ({
        id: status,
        label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      }));
    return [{ id: "all", label: "All" }, ...BASE_PAYMENT_FILTERS, ...extras];
  }, [orders]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (paymentFilter !== "all" && order.status !== paymentFilter) return false;
      if (controlFilter !== "all" && order.control_status !== controlFilter) return false;
      if (shippingFilter !== "all" && order.shipping_status !== shippingFilter) return false;
      if (!needle) return true;
      const haystack =
        `${order.order_number} ${order.customer_name} ${order.customer_email}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [orders, query, paymentFilter, controlFilter, shippingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp rather than trust `page`, so deleting the last row on a page can't
  // leave the list showing nothing.
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasTrendData = useMemo(() => {
    const cutoff = Date.now() - ADMIN_TREND_DAYS * 24 * 60 * 60 * 1000;
    return orders.some((order) => {
      const placed = new Date(order.created_at).getTime();
      return !Number.isNaN(placed) && placed >= cutoff;
    });
  }, [orders]);

  const filtersActive =
    query.trim() !== "" ||
    paymentFilter !== "all" ||
    controlFilter !== "all" ||
    shippingFilter !== "all";

  function clearFilters() {
    setQuery("");
    setPaymentFilter("all");
    setControlFilter("all");
    setShippingFilter("all");
    setPage(1);
  }

  return (
    <div className={adminUi.sectionStack}>
      <div className={adminUi.statGrid}>
        <StatCard
          label="Total orders"
          value={String(orders.length)}
          hint={orders.length === 0 ? "No orders placed yet" : "All time"}
        />
        <StatCard
          label="Confirmed revenue"
          value={formatPrice(stats.paidRevenue)}
          hint={
            stats.paidCount === 0
              ? "No confirmed payments yet"
              : `${stats.paidCount} paid order${stats.paidCount === 1 ? "" : "s"}`
          }
        />
        <StatCard
          label="Awaiting payment"
          value={String(stats.pendingCount)}
          hint={
            stats.pendingCount === 0
              ? "Nothing outstanding"
              : `${formatPrice(stats.pendingAmount)} not yet paid`
          }
        />
        <StatCard
          label="Needs attention"
          value={String(stats.onHold + stats.exceptions)}
          hint={
            stats.onHold + stats.exceptions === 0
              ? "No holds or delivery exceptions"
              : `${stats.onHold} on hold · ${stats.exceptions} delivery exception${
                  stats.exceptions === 1 ? "" : "s"
                }`
          }
        />
      </div>

      {hasTrendData ? (
        <OrdersTrendChart orders={orders} />
      ) : (
        <section className={adminUi.chartPanel}>
          <h3 className={adminUi.chartTitle}>Last {ADMIN_TREND_DAYS} days</h3>
          <p className={adminUi.chartSubtitle}>
            The trend chart appears once there are orders in the last {ADMIN_TREND_DAYS} days.
          </p>
        </section>
      )}

      <div className={adminUi.sectionCard}>
        <div className={adminUi.filterBar}>
          <div className={adminUi.pillRow}>
            {paymentFilters.map((filter) => {
              const active = paymentFilter === filter.id;
              const count =
                filter.id === "all" ? orders.length : (paymentCounts.get(filter.id) ?? 0);
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setPaymentFilter(filter.id);
                    setPage(1);
                  }}
                  aria-pressed={active}
                  className={`${adminUi.pill} ${active ? adminUi.pillActive : adminUi.pillIdle}`}
                >
                  {filter.label}
                  <span className={adminUi.pillCount}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className={adminUi.filterRow}>
            <div className="min-w-0 flex-1">
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order ref, customer name or email…"
                aria-label="Search orders"
                className={adminUi.input}
              />
            </div>
            <select
              value={controlFilter}
              onChange={(e) => {
                setControlFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by control status"
              className={adminUi.select}
            >
              <option value="all">All control statuses</option>
              {CONTROL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CONTROL_LABELS[status]}
                </option>
              ))}
            </select>
            <select
              value={shippingFilter}
              onChange={(e) => {
                setShippingFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by shipping status"
              className={adminUi.select}
            >
              <option value="all">All shipping statuses</option>
              {SHIPPING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SHIPPING_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className={adminUi.muted}>
              {filtered.length === orders.length
                ? `${orders.length} order${orders.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${orders.length} order${orders.length === 1 ? "" : "s"}`}
            </p>
            {filtersActive ? (
              <button type="button" onClick={clearFilters} className={adminUi.buttonSecondary}>
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {orders.length === 0 ? (
          <p className={adminUi.emptyState}>No orders yet</p>
        ) : filtered.length === 0 ? (
          <div className={adminUi.emptyState}>
            <p>No orders match these filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className={`${adminUi.buttonSecondary} mt-3`}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className={adminUi.orderList}>
              {pageItems.map((order) => {
                const deleting = deletingOrderId === order.id;
                return (
                  <div key={order.id} className={adminUi.orderRow}>
                    {/* The whole row is the link into the order, as in the DrivoraParts list. */}
                    <Link href={`/admin/orders/${order.id}`} className={adminUi.orderRowLink}>
                      <div className="min-w-0 space-y-0.5">
                        <p className={adminUi.orderRef}>{order.order_number}</p>
                        <p className={adminUi.orderMeta}>
                          {order.customer_name}
                          {order.customer_email ? ` · ${order.customer_email}` : ""}
                        </p>
                        <p className={adminUi.orderTime}>{formatTime(order.created_at)}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:items-center sm:gap-3">
                        <div className={adminUi.orderStatusRow}>
                          <StatusPill lane="payment" value={order.status} />
                          <StatusPill lane="control" value={order.control_status} />
                          <StatusPill lane="processing" value={order.processing_status} />
                          <StatusPill lane="shipping" value={order.shipping_status} />
                        </div>
                        <p className={adminUi.orderTotal}>{order.totalFormatted}</p>
                      </div>
                    </Link>

                    {/* Actions sit outside the link so the selects stay usable. */}
                    <div className={adminUi.orderRowActions}>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <select
                          value={order.control_status}
                          disabled={savingOrderField === `${order.id}:control-status`}
                          onChange={(e) =>
                            onStatusChange(
                              order.id,
                              "control-status",
                              "control_status",
                              e.target.value
                            )
                          }
                          aria-label={`Control status for order ${order.order_number}`}
                          title="Control status"
                          className={`${adminUi.selectCompact} bg-white text-gray-700`}
                        >
                          {CONTROL_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {CONTROL_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        <select
                          value={order.processing_status}
                          disabled={savingOrderField === `${order.id}:processing-status`}
                          onChange={(e) =>
                            onStatusChange(
                              order.id,
                              "processing-status",
                              "processing_status",
                              e.target.value
                            )
                          }
                          aria-label={`Processing status for order ${order.order_number}`}
                          title="Processing status"
                          className={`${adminUi.selectCompact} bg-white text-gray-700`}
                        >
                          {PROCESSING_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {PROCESSING_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDelete(order.id, order.order_number)}
                        disabled={deleting}
                        aria-label={`Delete order ${order.order_number}`}
                        title="Delete order"
                        className={adminUi.iconButtonDanger}
                      >
                        {deleting ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-90"
                              fill="currentColor"
                              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          <TrashIcon />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 ? (
              <div className={adminUi.pagination}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className={adminUi.buttonSecondary}
                >
                  Previous
                </button>
                <span className={adminUi.muted}>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className={adminUi.buttonSecondary}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
