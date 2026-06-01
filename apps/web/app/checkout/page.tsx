"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useUserId } from "@/lib/hooks/use-user-id";
import { cartOptions } from "@/lib/api/cart/cart-queries";
import { checkoutMutationOptions } from "@/lib/api/checkout/checkout-queries";
import { validateDiscountMutationOptions } from "@/lib/api/discount/discount-queries";
import { generateDiscountMutationOptions } from "@/lib/api/admin/admin-queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft, Check, Loader2, Gift } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { userId, isReady } = useUserId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    total: number;
  } | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderNumber: number;
    total: number;
  } | null>(null);

  const {
    data: cart,
    isLoading,
    error,
  } = useQuery({
    ...cartOptions(userId),
    enabled: isReady && !!userId,
    retry: false,
    refetchOnMount: true,
  });

  const checkoutMutation = useMutation({
    ...checkoutMutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      setOrderResult({
        orderNumber: data.order.orderNumber,
        total: data.order.total,
      });
    },
  });
  const discountMutation = useMutation({
    ...validateDiscountMutationOptions(),
    onSuccess: (data, variables) => {
      if (data.valid) {
        setAppliedDiscount({
          code: variables.discountCode,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          total: data.total,
        });
      } else {
        setAppliedDiscount(null);
      }
    },
  });
  const generateDiscountMutation = useMutation({
    ...generateDiscountMutationOptions(),
    onSuccess: (data) => {
      setDiscountCode(data.code);
      setAppliedDiscount(null);
    },
  });

  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;

  const handleGetDiscountCode = () => {
    if (!userId) return;
    generateDiscountMutation.mutate({ userId });
  };

  const handleApplyDiscount = () => {
    if (!userId || !discountCode.trim()) return;
    setAppliedDiscount(null);
    discountMutation.mutate({
      userId,
      discountCode: discountCode.trim(),
      subtotal,
    });
  };

  const handleCheckout = () => {
    if (!userId) return;
    checkoutMutation.mutate({
      userId,
      discountCode: appliedDiscount?.code ?? undefined,
    });
  };

  if (orderResult) {
    return (
      <main className="flex flex-1 items-center justify-center py-24 px-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="size-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="mt-4 text-xl">Order Placed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              Your order{" "}
              <span className="font-semibold text-foreground">
                #{orderResult.orderNumber}
              </span>{" "}
              has been placed successfully.
            </p>
            <p className="text-muted-foreground">
              Total charged:{" "}
              <span className="font-semibold text-foreground">
                ${(orderResult.total / 100).toFixed(2)}
              </span>
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full" onClick={() => router.push("/")}>
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (!isReady) {
    return (
      <main className="flex flex-1 items-center justify-center py-24 px-6">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center py-24 px-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-muted-foreground">
              {error?.message
                ? error?.message === "Cart not found"
                  ? "Cart is empty"
                  : "Failed to Load Card"
                : "Failed to load your cart."}
            </p>

            {error?.message !== "Cart not found" && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => router.refresh()}
              >
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col py-12 px-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-2xl font-semibold">Checkout</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <ShoppingCart className="size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Button asChild>
              <Link href="/">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3 mb-8">
            {cart.items.map((item) => (
              <Card key={item.id} size="sm">
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} &times; $
                      {(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 ml-4">
                    ${((item.price * item.quantity) / 100).toFixed(2)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-8">
            <CardContent className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  ${(subtotal / 100).toFixed(2)}
                </span>
              </div>
              {appliedDiscount && (
                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount ({appliedDiscount.discountPercent}%)</span>
                  <span>
                    -${(appliedDiscount.discountAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-lg">
                  $
                  {(
                    (appliedDiscount ? appliedDiscount.total : subtotal) / 100
                  ).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-4">
              <div>
                <label
                  htmlFor="discount"
                  className="text-sm font-medium mb-1 block"
                >
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="discount"
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setAppliedDiscount(null);
                    }}
                    placeholder="Enter code"
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    onClick={handleApplyDiscount}
                    disabled={
                      !discountCode.trim() || discountMutation.isPending
                    }
                    variant="outline"
                    className="shrink-0"
                  >
                    {discountMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Get Discount"
                    )}
                  </Button>
                </div>
                {discountMutation.data && !discountMutation.data.valid && (
                  <p className="text-sm text-destructive">
                    Invalid or expired discount code.
                  </p>
                )}
                {discountMutation.error && (
                  <p className="text-sm text-destructive">
                    {(discountMutation.error as Error).message}
                  </p>
                )}
                {appliedDiscount && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Code applied! You save {appliedDiscount.discountPercent}%.
                  </p>
                )}
                {generateDiscountMutation.data && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Code generated:{" "}
                    <strong>{generateDiscountMutation.data.code}</strong> (
                    {generateDiscountMutation.data.discountPercent}% off)
                  </p>
                )}
                {generateDiscountMutation.error && (
                  <p className="text-sm text-muted-foreground">
                    Place 5 orders to unlock a discount code.
                  </p>
                )}
              </div>
              <div className="pt-1">
                <Button
                  onClick={handleGetDiscountCode}
                  disabled={generateDiscountMutation.isPending}
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 h-auto px-0 text-muted-foreground hover:text-foreground"
                >
                  {generateDiscountMutation.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Gift className="size-3" />
                  )}
                  Get a discount code
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
                className="w-full"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </main>
  );
}
