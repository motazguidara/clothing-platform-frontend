// src/hooks/use-query.ts
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery as useBaseQuery } from '@tanstack/react-query';
import { useToast } from '@/providers/toast-provider';

export function useQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends unknown[] = unknown[]
>(
  options: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  > & {
    queryKey: TQueryKey;
    queryFn: () => Promise<TQueryFnData>;
    errorMessage?: string;
    showErrorToast?: boolean;
    onError?: (error: TError) => void;
  }
) {
  const { toast } = useToast();
  const showErrorToast = options.showErrorToast ?? true;

  return useBaseQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...options,
    onError: (error: TError) => {
      if (showErrorToast) {
        toast({
          title: options.errorMessage || 'An error occurred',
          description: error instanceof Error ? error.message : undefined,
          variant: 'destructive',
        });
      }
      options.onError?.(error);
    },
  } as UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>);
}
