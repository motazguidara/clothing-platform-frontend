"use client";

import React from "react";
import { QueryClient, QueryClientProvider, Hydrate } from "@tanstack/react-query";

export default function Providers({ children, dehydratedState }: { children: React.ReactNode; dehydratedState?: unknown }) {
  const [queryClient] = React.useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={dehydratedState}>{children}</Hydrate>
    </QueryClientProvider>
  );
}
