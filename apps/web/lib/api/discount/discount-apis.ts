import { request } from "@/utils/request";

export interface ValidateDiscountRequest {
  userId: string;
  discountCode: string;
  subtotal: number;
}

export interface ValidateDiscountResponse {
  valid: boolean;
  discountPercent: number;
  discountAmount: number;
  total: number;
}

export async function validateDiscount(
  data: ValidateDiscountRequest,
): Promise<ValidateDiscountResponse> {
  return request("/discount/validate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
