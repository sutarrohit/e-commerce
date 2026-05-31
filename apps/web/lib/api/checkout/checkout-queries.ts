import { mutationOptions } from "@tanstack/react-query";
import * as checkoutApis from "./checkout-apis";
import type { CheckoutRequest } from "./checkout-apis";

export function checkoutMutationOptions() {
  return mutationOptions({
    mutationKey: ["checkout"],
    mutationFn: (data: CheckoutRequest) => checkoutApis.checkout(data),
  });
}
