"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowRight, ShoppingCart, Check } from "lucide-react";
import type { Product } from "@/lib/api/product/product-apis";
import { addToCartMutationOptions } from "@/lib/api/cart/cart-queries";
import { useUserId } from "@/lib/hooks/use-user-id";
import Image from "next/image";

const ProductCard = ({ product }: { product: Product }) => {
  const { userId } = useUserId();
  const queryClient = useQueryClient();
  const [justAdded, setJustAdded] = useState(false);
  const mutation = useMutation({
    ...addToCartMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  });

  const handleAddToCart = () => {
    mutation.mutate({ userId, productId: product.id, quantity: 1 });
  };

  return (
    <Card className='gap-0 py-0 overflow-hidden group duration-300'>
      <div className='relative overflow-hidden'>
        <div className='w-full h-65'>
          <Image
            src={product.image}
            alt={product.name}
            width={200}
            height={200}
            className='w-full h-full object-cover group-hover:brightness-50 group-hover:scale-125 transition duration-300 delay-75'
          />
        </div>

        <div className='absolute top-2 right-2 hidden p-4 rounded-full group-hover:block'>
          <ArrowRight className='text-foreground' />
        </div>
      </div>

      <CardContent className='p-4'>
        <div className='flex justify-between gap-5'>
          <div>
            <a href={`/products/${product.id}`}>
              <h4 className='text-md font-medium duration-300 '>{product.name}</h4>
            </a>
          </div>

          <Badge variant='secondary' className='text-12'>
            ${(product.price / 100).toLocaleString()}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className='px-4 pb-4 pt-4 flex-1'>
        <Button onClick={handleAddToCart} disabled={mutation.isPending} className='w-full cursor-pointer'>
          {mutation.isPending ? (
            <>
              <ShoppingCart className='size-4 animate-bounce' />
              Adding...
            </>
          ) : justAdded ? (
            <>
              <Check className='size-4' />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className='size-4' />
              Add to Cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
