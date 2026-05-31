import { request } from "@/utils/request";

export interface GenerateDiscountRequest {
  userId: string;
}

export interface GenerateDiscountResponse {
  code: string;
  discountPercent: number;
  userId: string;
}

export interface AdminSummaryResponse {
  totalItemsPurchased: number;
  totalRevenue: number;
  totalDiscountCodes: number;
  totalDiscountsGiven: number;
  totalOrders: number;
}

export async function generateDiscount(
  data: GenerateDiscountRequest,
): Promise<GenerateDiscountResponse> {
  return request("/admin/generate-discount", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAdminSummary(): Promise<AdminSummaryResponse> {
  return request("/admin/summary");
}
