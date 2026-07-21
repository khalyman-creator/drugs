"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) setCart(normalizeCart(JSON.parse(stored)));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

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
