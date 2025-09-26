"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/useAuth";

type Props = {
  children: React.ReactNode;
};

// Create a singleton QueryClient per browser session
let browserQueryClient: QueryClient | null = null;
function getQueryClient(): QueryClient {
  if (browserQueryClient == null) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 30,
          gcTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });
  }
  return browserQueryClient;
}

export function QueryProvider({ children }: Props) {
  const client = React.useState(getQueryClient)[0];
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}



