"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";

interface ProvidersProps {
  children: React.ReactNode;
  dehydratedState?: any; // Using any to match the expected type from @tanstack/react-query
}

export default function Providers({ children, dehydratedState }: ProvidersProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
