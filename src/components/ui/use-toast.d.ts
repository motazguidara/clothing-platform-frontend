declare module '@/components/ui/use-toast' {
  import { ReactNode } from 'react';

  export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

  export interface ToastActionElement {
    label: string;
    onClick: () => void;
  }

  export interface ToastProps {
    id: string;
    title?: string;
    description?: ReactNode;
    action?: ToastActionElement;
    variant?: ToastVariant;
    duration?: number;
    onOpenChange?: (open: boolean) => void;
  }

  export interface ToastOptions {
    id?: string;
    title?: string;
    description?: ReactNode;
    action?: ToastActionElement;
    variant?: ToastVariant;
    duration?: number;
    onOpenChange?: (open: boolean) => void;
  }

  export interface ToastReturn {
    id: string;
    dismiss: () => void;
    update: (props: ToastProps) => void;
  }

  export interface ToastContextProps {
    toasts: ToastProps[];
    toast: (props: ToastOptions) => ToastReturn;
    dismiss: (toastId?: string) => void;
  }

  export const useToast: () => ToastContextProps;
  export const toast: (props: ToastOptions) => ToastReturn;
}
