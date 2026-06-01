"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  adminSummaryOptions,
  generateDiscountMutationOptions,
} from "@/lib/api/admin/admin-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ShoppingBag,
  Package,
  DollarSign,
  TicketPercent,
  Gift,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const statCards = [
  { key: "totalOrders", label: "Total Orders", icon: ShoppingBag },
  { key: "totalItemsPurchased", label: "Items Purchased", icon: Package },
  { key: "totalRevenue", label: "Total Revenue", icon: DollarSign },
  { key: "totalDiscountCodes", label: "Discount Codes", icon: TicketPercent },
  { key: "totalDiscountsGiven", label: "Discounts Given", icon: Gift },
] as const;

export default function AdminPage() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);
  const [generatedCode, setGeneratedCode] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);

  const { data: summary, isLoading, error } = useQuery(adminSummaryOptions());

  const generateMutation = useMutation({
    ...generateDiscountMutationOptions(),
    onSuccess: (data) => {
      setGeneratedCode({
        code: data.code,
        discountPercent: data.discountPercent,
      });
    },
    onError: () => {
      setGeneratedCode(null);
    },
  });

  const handleGenerate = () => {
    if (!userId.trim()) return;
    setGeneratedCode(null);
    generateMutation.mutate({ userId: userId.trim() });
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const remainingOrders = (() => {
    if (!generateMutation.error) return null;
    const match = (generateMutation.error as Error).message.match(/\((\d+)\)/);
    if (!match) return null;
    const count = parseInt(match[1], 10);
    const nthOrder = 5;
    const remaining = nthOrder - (count % nthOrder);
    return remaining;
  })();

  return (
    <main className="flex flex-1 flex-col py-12 px-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-2xl font-semibold">Admin</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Failed to load admin summary.
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {statCards.map(({ key, label, icon: Icon }) => {
            const value = summary[key];
            const display =
              key === "totalRevenue" || key === "totalDiscountsGiven"
                ? formatCurrency(value)
                : value.toLocaleString();
            return (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{display}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate Discount Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="userId" className="text-sm font-medium mb-1 block">
              User ID
            </label>
            <div className="flex gap-2">
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setGeneratedCode(null);
                }}
                placeholder="Enter user ID"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                onClick={handleGenerate}
                disabled={!userId.trim() || generateMutation.isPending}
                className="shrink-0 cursor-pointer"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          </div>
          {generatedCode && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
              <p className="text-sm text-muted-foreground">
                Code:{" "}
                <strong className="text-foreground font-mono">
                  {generatedCode.code}
                </strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Discount:{" "}
                <strong className="text-foreground">
                  {generatedCode.discountPercent}% off
                </strong>
              </p>
            </div>
          )}
          {generateMutation.error && (
            <p className="text-sm text-destructive">
              {remainingOrders !== null
                ? remainingOrders === 1
                  ? "1 more order to get a coupon"
                  : `${remainingOrders} more orders to get a coupon`
                : (generateMutation.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
