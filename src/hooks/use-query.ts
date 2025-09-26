// src/hooks/use-query.ts
import { UseQueryOptions, useQuery as useBaseQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';

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
    onError: (error) => {
      if (showErrorToast) {
        toast({
          title: options.errorMessage || 'An error occurred',
          description: error.message,
          variant: 'destructive',
        });
      }
      options.onError?.(error);
    },
  });
}
