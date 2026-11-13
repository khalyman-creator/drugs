"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Cart,
  CartItem,
  CART_STORAGE_KEY,
  addToCart,
  cartItemCount,
  removeFromCart,
  updateCartQuantity,
  replaceCartWithItem,
  normalizeCart,
} from "@/lib/cart";

type CartContextType = {
  cart: Cart;
  itemCount: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQty: (lineKey: string, quantity: number) => void;
  removeItem: (lineKey: string) => void;
  replaceCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  clearCart: () => void;
  hydrated: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

/**
 * Reads the persisted cart. Returns an empty cart on the server, and never
 * throws on malformed JSON or blocked storage.
 */
/* Stable identities, so useSyncExternalStore does not resubscribe every render. */
const subscribeNever = () => () => {};
const getHydratedOnClient = () => true;
const getHydratedOnServer = () => false;

function readStoredCart(): Cart {
  if (typeof window === "undefined") return { items: [] };
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    return stored ? normalizeCart(JSON.parse(stored)) : { items: [] };
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  /*
   * Read straight into initial state rather than syncing it in after mount.
   * This is hydration-safe because every consumer gates cart-dependent output
   * behind `hydrated` below, so the server HTML and the first client render
   * agree no matter what is in storage. The write effect is likewise still
   * gated on `hydrated`, so nothing is persisted before the first paint.
   */
  const [cart, setCart] = useState<Cart>(readStoredCart);

  /*
   * "Are we past hydration yet?", without an effect. useSyncExternalStore hands
   * back the server snapshot (false) during SSR and the hydration render, then
   * the client snapshot (true) once hydrated — exactly the old flag's
   * semantics, with no setState and no cascading render.
   */
  const hydrated = useSyncExternalStore(subscribeNever, getHydratedOnClient, getHydratedOnServer);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setCart((prev) => addToCart(prev, item));
  }, []);

  const updateQty = useCallback((lineKey: string, quantity: number) => {
    setCart((prev) => updateCartQuantity(prev, lineKey, quantity));
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setCart((prev) => removeFromCart(prev, lineKey));
  }, []);

  const replaceCart = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setCart(replaceCartWithItem(item));
  }, []);

  const clearCart = useCallback(() => {
    setCart({ items: [] });
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cartItemCount(cart),
        addItem,
        updateQty,
        removeItem,
        replaceCart,
        clearCart,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
