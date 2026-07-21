import { NextResponse } from "next/server";
import { processCheckout } from "@/lib/checkout/service";
import {
  lockOrderItemsFromCatalog,
  parseRawCheckoutItems,
} from "@/lib/checkout/validate-items";

function parseCustomer(raw: unknown) {
  if (typeof raw !== "object" || raw === null) return null;

  const fullName =
    typeof (raw as { fullName?: string }).fullName === "string"
      ? (raw as { fullName: string }).fullName.trim()
      : typeof (raw as { name?: string }).name === "string"
        ? (raw as { name: string }).name.trim()
        : "";
  const email =
    typeof (raw as { email?: string }).email === "string"
      ? (raw as { email: string }).email.trim()
      : "";

  if (!fullName || !email) return null;

  const address =
    typeof (raw as { address?: string }).address === "string"
      ? (raw as { address: string }).address.trim()
      : "";
  const city =
    typeof (raw as { city?: string }).city === "string"
      ? (raw as { city: string }).city.trim()
      : "";
  const zip =
    typeof (raw as { zip?: string }).zip === "string"
      ? (raw as { zip: string }).zip.trim()
      : "";

  const shippingAddress = [address, city, zip].filter(Boolean).join(", ");

  return {
    fullName,
    email,
    phone:
      typeof (raw as { phone?: string }).phone === "string"
        ? (raw as { phone: string }).phone.trim()
        : undefined,
    shippingAddress: shippingAddress || undefined,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const rawItems = parseRawCheckoutItems(body?.items);
    const customer = parseCustomer(body?.customer);

    if (!rawItems || !customer) {
      return NextResponse.json(
        { error: "Invalid checkout payload" },
        { status: 400 }
      );
    }

    let lockedItems;
    try {
      lockedItems = lockOrderItemsFromCatalog(rawItems);
    } catch (validationError) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : "Invalid order items",
        },
        { status: 400 }
      );
    }

    const result = await processCheckout({
      items: lockedItems,
      customer,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Checkout failed",
      },
      { status: 400 }
    );
  }
}
