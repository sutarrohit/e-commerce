import { mutationOptions, queryOptions } from "@tanstack/react-query";
import * as adminApis from "./admin-apis";
import type { GenerateDiscountRequest } from "./admin-apis";

export function adminSummaryOptions() {
  return queryOptions({
    queryKey: ["admin", "summary"],
    queryFn: () => adminApis.getAdminSummary(),
    staleTime: 1000 * 60 * 5,
  });
}

export function generateDiscountMutationOptions() {
  return mutationOptions({
    mutationKey: ["admin", "generate-discount"],
    mutationFn: (data: GenerateDiscountRequest) =>
      adminApis.generateDiscount(data),
  });
}
