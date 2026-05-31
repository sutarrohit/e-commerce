import { request } from "@/utils/request";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discountCode?: string | null;
  discountAmount: number;
  total: number;
  orderNumber: number;
  placedAt: string;
}

export interface CheckoutRequest {
  userId: string;
  discountCode?: string;
}

export interface CheckoutResponse {
  order: Order;
}

export async function checkout(
  data: CheckoutRequest,
): Promise<CheckoutResponse> {
  return request("/checkout", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
