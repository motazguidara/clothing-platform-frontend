declare module '@/components/ui/tooltip' {
  import * as React from 'react';
  
  export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    delayDuration?: number;
    disableHoverableContent?: boolean;
  }

  export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }

  export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionPadding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
    hideWhenDetached?: boolean;
  }

  export const Tooltip: React.FC<TooltipProps> & {
    Trigger: React.FC<TooltipTriggerProps>;
    Content: React.FC<TooltipContentProps>;
  };
  
  export const TooltipTrigger: React.FC<TooltipTriggerProps>;
  export const TooltipContent: React.FC<TooltipContentProps>;
  export const TooltipProvider: React.FC<{ children: React.ReactNode }>;
}
