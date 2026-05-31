"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  scriptProps,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const resolvedScriptProps =
    scriptProps ??
    (typeof window === "undefined"
      ? undefined
      : { type: "application/json" as const });
  return (
    <NextThemesProvider scriptProps={resolvedScriptProps} {...props}>
      {children}
    </NextThemesProvider>
  );
}
