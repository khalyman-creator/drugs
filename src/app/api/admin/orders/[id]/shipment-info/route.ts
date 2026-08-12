import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/supabase-orders";
import { updateShipmentInfo, updateShipmentVisibility } from "@/lib/db/supabase-shipments";
import { isAdminLoggedIn } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const patch: Record<string, string | number | null> = {};

  for (const key of [
    "carrier",
    "tracking_number",
    "shipment_type",
    "weight_unit",
    "origin",
    "destination",
    "estimated_delivery",
  ] as const) {
    if (key in body) {
      patch[key] = body[key] === "" ? null : String(body[key]);
    }
  }

  if ("weight_value" in body) {
    patch.weight_value = body.weight_value === "" || body.weight_value == null
      ? null
      : Number(body.weight_value);
  }

  const updated = await updateShipmentInfo(id, patch);

  if ("show_shipment_details" in body || "hidden_fields" in body) {
    const visibility = await updateShipmentVisibility(id, {
      showShipmentDetails: typeof body.show_shipment_details === "boolean" ? body.show_shipment_details : undefined,
      hiddenFields: Array.isArray(body.hidden_fields) ? body.hidden_fields.filter((f: unknown) => typeof f === "string") : undefined,
    });
    return NextResponse.json(visibility);
  }

  return NextResponse.json(updated);
}
