// src/hooks/use-mutation.ts
import { UseMutationOptions, useMutation as useBaseMutation } from '@tanstack/react-query';
import { useToast } from './use-toast';

export function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  > & {
    mutationFn: (variables: TVariables) => Promise<TData>;
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  }
) {
  const { toast } = useToast();
  const showSuccessToast = options.showSuccessToast ?? true;
  const showErrorToast = options.showErrorToast ?? true;

  return useBaseMutation<TData, TError, TVariables, TContext>({
    ...options,
    onSuccess: (data, variables, context) => {
      if (showSuccessToast && options.successMessage) {
        toast({
          title: 'Success',
          description: options.successMessage,
        });
      }
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (showErrorToast) {
        toast({
          title: options.errorMessage || 'An error occurred',
          description: error.message,
          variant: 'destructive',
        });
      }
      options.onError?.(error, variables, context);
    },
  });
}
