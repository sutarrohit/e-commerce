import { request } from "@/utils/request";

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCart {
  userId: string;
  productId: string;
  quantity: number;
}

export async function getCart(userId: string): Promise<Cart> {
  return request(`/cart/${userId}`);
}

export async function addToCart(data: AddToCart): Promise<Cart> {
  return request("/add/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
