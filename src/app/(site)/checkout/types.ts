export type PendingOrder = {
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentUrl: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  customerEmail: string;
  items: { name: string; price: number; quantity: number }[];
};
