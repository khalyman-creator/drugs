import { NextRequest, NextResponse } from "next/server";
import { deleteOrder, getOrderById } from "@/lib/db/supabase-orders";
import { getOrCreateShipmentForOrder } from "@/lib/db/supabase-shipments";
import { listOrderStatusEvents } from "@/lib/db/supabase-order-events";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [shipment, events] = await Promise.all([
    getOrCreateShipmentForOrder(id),
    listOrderStatusEvents(id),
  ]);

  return NextResponse.json({ order, shipment, events });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteOrder(id);
  return NextResponse.json({ success: true });
}
