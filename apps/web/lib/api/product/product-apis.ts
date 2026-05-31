import { request } from "@/utils/request";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  createdAt: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
}

export async function listProducts(
  filters?: ProductFilters,
): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }
  const qs = params.toString();
  return request(`/products${qs ? `?${qs}` : ""}`);
}

export async function getProductById(id: string): Promise<Product> {
  return request(`/products/${id}`);
}
