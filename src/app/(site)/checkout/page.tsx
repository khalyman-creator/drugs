import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">
          Loading checkout...
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
