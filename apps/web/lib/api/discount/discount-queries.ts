import { mutationOptions } from "@tanstack/react-query";
import { validateDiscount } from "./discount-apis";
import type { ValidateDiscountRequest } from "./discount-apis";

export function validateDiscountMutationOptions() {
  return mutationOptions({
    mutationKey: ["discount", "validate"],
    mutationFn: (data: ValidateDiscountRequest) => validateDiscount(data),
  });
}
