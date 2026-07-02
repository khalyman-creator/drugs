import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Page not found</p>
      <Link href="/products" className="mt-6 inline-block text-brand-600 hover:underline">
        Browse products
      </Link>
    </div>
  );
}
