import { mutationOptions, queryOptions } from "@tanstack/react-query";
import * as cartApis from "./cart-apis";
import type { AddToCart } from "./cart-apis";

export function cartOptions(userId: string) {
  return queryOptions({
    queryKey: ["cart", userId],
    queryFn: () => cartApis.getCart(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function addToCartMutationOptions() {
  return mutationOptions({
    mutationKey: ["cart", "add"],
    mutationFn: (data: AddToCart) => cartApis.addToCart(data),
  });
}
