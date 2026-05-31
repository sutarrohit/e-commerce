"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";

import type * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { UserIdProvider } from "./user-id-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <UserIdProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </UserIdProvider>
    </QueryClientProvider>
  );
}
