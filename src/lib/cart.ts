export type CartItem = {
  lineKey: string;
  product_id: number;
  slug: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  variant_label: string;
  section_id: number;
};

export type Cart = {
  items: CartItem[];
};

export function makeLineKey(productId: number, variantLabel: string): string {
  return `${productId}::${variantLabel}`;
}

export function cartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function addToCart(cart: Cart, item: Omit<CartItem, "quantity"> & { quantity?: number }): Cart {
  const quantity = item.quantity ?? 1;
  const lineKey = item.lineKey ?? makeLineKey(item.product_id, item.variant_label);
  const normalized = { ...item, lineKey, quantity };

  const existing = cart.items.find((i) => i.lineKey === lineKey);
  if (existing) {
    return {
      items: cart.items.map((i) =>
        i.lineKey === lineKey ? { ...i, quantity: i.quantity + quantity } : i
      ),
    };
  }
  return { items: [...cart.items, normalized] };
}

export function updateCartQuantity(cart: Cart, lineKey: string, quantity: number): Cart {
  if (quantity <= 0) {
    return { items: cart.items.filter((i) => i.lineKey !== lineKey) };
  }
  return {
    items: cart.items.map((i) => (i.lineKey === lineKey ? { ...i, quantity } : i)),
  };
}

export function removeFromCart(cart: Cart, lineKey: string): Cart {
  return { items: cart.items.filter((i) => i.lineKey !== lineKey) };
}

export function replaceCartWithItem(item: Omit<CartItem, "quantity"> & { quantity?: number }): Cart {
  const quantity = item.quantity ?? 1;
  const lineKey = item.lineKey ?? makeLineKey(item.product_id, item.variant_label);
  return { items: [{ ...item, lineKey, quantity }] };
}

export const CART_STORAGE_KEY = "local-shop-cart";

/** Migrate old cart items missing lineKey / variant fields */
export function normalizeCart(raw: unknown): Cart {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as Cart).items)) {
    return { items: [] };
  }

  return {
    items: (raw as Cart).items.map((item) => {
      const variant = item.variant_label ?? `${item.quantity ?? 1} unit(s)`;
      const lineKey = item.lineKey ?? makeLineKey(item.product_id, variant);
      return {
        ...item,
        lineKey,
        variant_label: variant,
        section_id: item.section_id ?? 9,
        quantity: item.quantity ?? 1,
      };
    }),
  };
}
