import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber, getAllOrders } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");

  if (orderNumber) {
    const result = getOrderByNumber(orderNumber);
    if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(result);
  }

  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getAllOrders());
}
