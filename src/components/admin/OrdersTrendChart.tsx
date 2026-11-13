"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/format";
import { ADMIN_TREND_DAYS, adminUi } from "./admin-ui";

export type TrendOrder = {
  created_at: string;
  /** Supabase returns numerics as strings on some paths, so this is widened. */
  total: number | string;
  status: string;
};

/**
 * Local-date bucket key. Deliberately local rather than UTC: buckets should line
 * up with the day the admin sees as "today", not with the UTC calendar.
 */
function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

type TrendPoint = { key: string; label: string; orders: number; revenue: number };

function buildTrend(orders: TrendOrder[], days: number): TrendPoint[] {
  const points: TrendPoint[] = [];
  const index = new Map<string, TrendPoint>();

  // Seed every day in the window so gaps render as zero instead of collapsing.
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const point: TrendPoint = {
      key: dayKey(date),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      orders: 0,
      revenue: 0,
    };
    points.push(point);
    index.set(point.key, point);
  }

  for (const order of orders) {
    const placed = new Date(order.created_at);
    if (Number.isNaN(placed.getTime())) continue;

    const point = index.get(dayKey(placed));
    if (!point) continue; // Outside the window.

    point.orders += 1;
    // Only confirmed payments count toward revenue — pending checkouts are not money.
    if (order.status === "paid") {
      point.revenue += Number(order.total) || 0;
    }
  }

  return points;
}

const gridStroke = "rgba(17,24,39,0.08)";
const axisStroke = "#9ca3af";
const ordersFill = "#fca5a5"; // brand-300 — the supporting series
const revenueStroke = "#dc2626"; // brand-600 — the series that matters most
const tooltipStyle = {
  backgroundColor: "rgba(17,24,39,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

export default function OrdersTrendChart({ orders }: { orders: TrendOrder[] }) {
  const data = buildTrend(orders, ADMIN_TREND_DAYS);
  const totalOrders = data.reduce((sum, point) => sum + point.orders, 0);
  const totalRevenue = data.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <section className={adminUi.chartPanel}>
      <div>
        <h3 className={adminUi.chartTitle}>Last {ADMIN_TREND_DAYS} days</h3>
        <p className={adminUi.chartSubtitle}>
          {totalOrders} order{totalOrders === 1 ? "" : "s"} placed ·{" "}
          {formatPrice(totalRevenue)} confirmed revenue
        </p>
      </div>

      <div className={adminUi.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke={gridStroke}
              tick={{ fill: axisStroke, fontSize: 12 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="orders"
              allowDecimals={false}
              stroke={gridStroke}
              tick={{ fill: axisStroke, fontSize: 12 }}
              tickLine={false}
              width={32}
            />
            <YAxis
              yAxisId="revenue"
              orientation="right"
              stroke={gridStroke}
              tick={{ fill: axisStroke, fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value: number) => `$${value}`}
              width={56}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => {
                const raw = Array.isArray(value) ? value[0] : value;
                const amount = Number(raw ?? 0) || 0;
                return name === "Revenue" ? formatPrice(amount) : String(amount);
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar
              yAxisId="orders"
              dataKey="orders"
              name="Orders"
              fill={ordersFill}
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={revenueStroke}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
