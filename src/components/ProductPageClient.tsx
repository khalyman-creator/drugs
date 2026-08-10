"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { makeLineKey } from "@/lib/cart";
import {
  formatVariantLineName,
  getActiveOptions,
  getDisplayFromPrice,
  getPricingMode,
  resolvePricingSelection,
} from "@/lib/pricing";
import type { Product, ProductImage, ProductPricingOption } from "@/lib/types";
import { useCart } from "./CartProvider";
import { SectionQuantityPicker, type SectionSelection } from "./SectionQuantityPicker";

function ProductGallery({ product, galleryImages }: { product: Product; galleryImages: ProductImage[] }) {
  const images = [product.image_url, ...galleryImages.map((img) => img.image_url)].filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = images[activeIndex] ?? "/placeholder.svg";
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setActiveIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, images.length]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) setActiveIndex((i) => Math.min(i + 1, images.length - 1));
    else setActiveIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="focus-ring block w-full overflow-hidden rounded-xl bg-gray-50"
        aria-label="View full-size image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeImage} alt={product.name} className="aspect-square w-full object-cover" />
      </button>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`overflow-hidden rounded-lg border-2 transition ${
                i === activeIndex ? "border-brand-600" : "border-transparent hover:border-gray-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${product.name} ${i + 1}`} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 z-[80] bg-black/95">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image viewer"
            className="focus-ring absolute right-4 top-4 z-10 text-3xl leading-none text-white/80 hover:text-white"
          >
            ×
          </button>
          <div
            className="flex h-full w-full items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage} alt={product.name} className="max-h-full max-w-full object-contain" />
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
                disabled={activeIndex === 0}
                aria-label="Previous image"
                className="focus-ring absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white disabled:opacity-30 sm:left-4"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => Math.min(i + 1, images.length - 1))}
                disabled={activeIndex === images.length - 1}
                aria-label="Next image"
                className="focus-ring absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white disabled:opacity-30 sm:right-4"
              >
                ›
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
                {activeIndex + 1} / {images.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AddToCartBlock({
  sectionId,
  productId,
  basePrice,
  pricingOptions,
  allowCustomQuantity,
  onSelectionChange,
  onAdd,
  onBuyNow,
  added,
  loading,
  unavailable,
}: {
  sectionId: number;
  productId: number;
  basePrice: number;
  pricingOptions: ProductPricingOption[];
  allowCustomQuantity: boolean;
  onSelectionChange: (selection: SectionSelection) => void;
  onAdd: () => void;
  onBuyNow: () => void;
  added: boolean;
  loading: boolean;
  unavailable: boolean;
}) {
  const { hydrated } = useCart();

  if (!hydrated) {
    return <div className="h-24 animate-pulse rounded-lg bg-gray-100" />;
  }

  return (
    <div className="space-y-4">
      <SectionQuantityPicker
        sectionId={sectionId}
        productId={productId}
        basePrice={basePrice}
        pricingOptions={pricingOptions}
        allowCustomQuantity={allowCustomQuantity}
        onChange={onSelectionChange}
      />

      <button
        type="button"
        onClick={onAdd}
        disabled={unavailable}
        className="w-full rounded-lg bg-brand-600 py-4 text-base font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60"
      >
        {added ? "✓ Added to Cart" : "Add to Cart"}
      </button>

      <button
        type="button"
        onClick={onBuyNow}
        disabled={loading || unavailable}
        className="w-full rounded-lg border-2 border-gray-800 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
      >
        Buy Now
      </button>
    </div>
  );
}

function StickyBuyBar({
  product,
  selection,
  onAdd,
  added,
  visible,
}: {
  product: Product;
  selection: SectionSelection;
  onAdd: () => void;
  added: boolean;
  visible: boolean;
}) {
  const unavailable = selection.quantity === 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-gray-900 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform duration-200 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url || "/placeholder.svg"}
          alt=""
          className="h-11 w-11 shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
          <p className="truncate text-xs text-gray-500">{selection.variantLabel}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={unavailable}
          className="focus-ring shrink-0 rounded-sm border-2 border-gray-900 bg-brand-600 px-4 py-2.5 text-sm font-bold uppercase text-white shadow-pop-ink disabled:opacity-60"
        >
          {added ? "Added ✓" : `Add — ${formatPrice(selection.price * selection.quantity)}`}
        </button>
      </div>
    </div>
  );
}

export function ProductPageClient({
  product,
  sectionName,
  pricingOptions,
  galleryImages,
}: {
  product: Product;
  sectionName: string;
  pricingOptions: ProductPricingOption[];
  galleryImages: ProductImage[];
}) {
  const sectionId = product.section_id;
  const mode = getPricingMode(sectionId);
  const { addItem, replaceCart } = useCart();
  const router = useRouter();

  const [selection, setSelection] = useState<SectionSelection>(() => {
    if (mode !== "standard") {
      const active = getActiveOptions(pricingOptions);
      if (active.length > 0) {
        return resolvePricingSelection(active[0].id, pricingOptions, mode);
      }
      return { variantLabel: "Unavailable", price: 0, quantity: 0 };
    }
    return { variantLabel: "1 unit", price: product.price, quantity: 1 };
  });
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pastBuyBox, setPastBuyBox] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const onSelectionChange = useCallback((next: SectionSelection) => {
    setSelection(next);
  }, []);

  useEffect(() => {
    function onScroll() {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;
      setPastBuyBox(sentinel.getBoundingClientRect().bottom < 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function buildCartItem() {
    const lineKey = makeLineKey(product.id, selection.variantLabel);
    return {
      lineKey,
      product_id: product.id,
      slug: product.slug,
      name: formatVariantLineName(product.name, selection.variantLabel),
      price: selection.price,
      image_url: product.image_url,
      variant_label: selection.variantLabel,
      section_id: sectionId,
      quantity: selection.quantity,
    };
  }

  function handleAdd() {
    addItem(buildCartItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  function handleBuyNow() {
    setLoading(true);
    replaceCart(buildCartItem());
    router.push("/checkout");
  }

  const lineTotal = selection.price * selection.quantity;
  const unavailable = selection.quantity === 0;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-brand-600">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Main product layout */}
      <div className="grid gap-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
        {/* Image */}
        <ProductGallery product={product} galleryImages={galleryImages} />

        {/* Product summary */}
        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            {sectionName}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
            {product.name}
          </h1>

          <p className="mt-5 text-4xl font-bold text-brand-700">
            {mode === "standard"
              ? formatPrice(product.price)
              : formatPrice(getDisplayFromPrice(pricingOptions, product.price))}
          </p>

          <p className="mt-6 border-t border-gray-100 pt-6 text-gray-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8">
            <AddToCartBlock
              sectionId={sectionId}
              productId={product.id}
              basePrice={product.price}
              pricingOptions={pricingOptions}
              allowCustomQuantity={product.allow_custom_quantity}
              onSelectionChange={onSelectionChange}
              onAdd={handleAdd}
              onBuyNow={handleBuyNow}
              added={added}
              loading={loading}
              unavailable={unavailable}
            />
          </div>
          <div ref={sentinelRef} />

          <ul className="mt-8 space-y-2 border-t border-gray-100 pt-6 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> Secure checkout
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> BTC payment available at checkout
            </li>
          </ul>
        </div>
      </div>

      {/* Product Details */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <div className="max-w-3xl text-gray-600">
          <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
          <p className="mt-4 leading-relaxed">{product.description}</p>
          {product.details && (
            <p className="mt-4 whitespace-pre-line leading-relaxed">{product.details}</p>
          )}
          <ul className="mt-6 space-y-2 border-t border-gray-100 pt-6 text-sm">
            <li>
              <span className="font-medium text-gray-900">Category:</span> {sectionName}
            </li>
            <li>
              <span className="font-medium text-gray-900">Availability:</span> In stock
            </li>
          </ul>
        </div>
      </div>

      <StickyBuyBar
        product={product}
        selection={selection}
        onAdd={handleAdd}
        added={added}
        visible={pastBuyBox}
      />
      {pastBuyBox && <div className="h-20 lg:hidden" aria-hidden />}
    </>
  );
}
