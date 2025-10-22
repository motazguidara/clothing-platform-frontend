// src/hooks/use-mutation.ts
import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation as useBaseMutation } from '@tanstack/react-query';
import { useToast } from '@/providers/toast-provider';

type MutationOptions<TData, TError, TVariables, TContext> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationFn'
> & {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage?: string;
  errorMessage?: string | ((error: TError) => string);
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<void>;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void | Promise<void>;
};

export function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: MutationOptions<TData, TError, TVariables, TContext>
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
        const defaultMessage = 'An error occurred';
        const errorMessage = options.errorMessage || defaultMessage;
        const message = typeof errorMessage === 'function' 
          ? errorMessage(error)
          : errorMessage;
          
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
      options.onError?.(error, variables, context);
    },
  });
}
