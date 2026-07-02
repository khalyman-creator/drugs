export type CartItem = {
  product_id: number;
  slug: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
};

export function cartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function addToCart(cart: Cart, item: Omit<CartItem, "quantity">, qty = 1): Cart {
  const existing = cart.items.find((i) => i.product_id === item.product_id);
  if (existing) {
    return {
      items: cart.items.map((i) =>
        i.product_id === item.product_id ? { ...i, quantity: i.quantity + qty } : i
      ),
    };
  }
  return { items: [...cart.items, { ...item, quantity: qty }] };
}

export function updateCartQuantity(cart: Cart, productId: number, quantity: number): Cart {
  if (quantity <= 0) {
    return { items: cart.items.filter((i) => i.product_id !== productId) };
  }
  return {
    items: cart.items.map((i) =>
      i.product_id === productId ? { ...i, quantity } : i
    ),
  };
}

export function removeFromCart(cart: Cart, productId: number): Cart {
  return { items: cart.items.filter((i) => i.product_id !== productId) };
}

export function replaceCartWithItem(item: Omit<CartItem, "quantity">, quantity = 1): Cart {
  return { items: [{ ...item, quantity }] };
}

export const CART_STORAGE_KEY = "local-shop-cart";
