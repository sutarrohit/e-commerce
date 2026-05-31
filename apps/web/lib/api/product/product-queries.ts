import { mutationOptions, queryOptions } from "@tanstack/react-query";
import * as productApis from "./product-apis";
import type { ProductFilters } from "./product-apis";

export function productListOptions(filters?: ProductFilters) {
  return queryOptions({
    queryKey: ["products", "list", filters],
    queryFn: () => productApis.listProducts(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function productDetailOptions(id: string) {
  return queryOptions({
    queryKey: ["products", "detail", id],
    queryFn: () => productApis.getProductById(id),
    staleTime: Infinity,
  });
}
