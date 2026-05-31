import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { productListOptions } from "@/lib/api/product/product-queries";
import ProductList from "@/components/ProductList";

export default async function Home() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(productListOptions({ page: 1, limit: 12 }));

  return (
    <div className='flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black'>
      <main className='flex flex-1 w-full flex-col py-12 px-6'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ProductList />
        </HydrationBoundary>
      </main>
    </div>
  );
}
