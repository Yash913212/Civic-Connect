"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

// Suppress React 19 script tag warnings in development
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const isScriptWarning =
      (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) ||
      (args[0] instanceof Error && args[0].message.includes("Encountered a script tag"));
    
    if (isScriptWarning) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
