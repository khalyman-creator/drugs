-- Real "Best Sellers" data, aggregated from actual completed orders rather
-- than fabricated — mirrors the read-only RPC pattern already used by
-- find_orders_by_reference_prefix (migration 009).

CREATE OR REPLACE FUNCTION best_selling_products(limit_count INT DEFAULT 8)
RETURNS TABLE (product_id INT, total_quantity BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT oi.product_id, SUM(oi.quantity)::BIGINT AS total_quantity
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
  GROUP BY oi.product_id
  ORDER BY total_quantity DESC
  LIMIT limit_count;
$$;
