import React from 'react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface TouchOptimizedButtonProps extends React.ComponentProps<typeof Button> {
  touchOptimized?: boolean;
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  touchOptimized = true,
  className,
  children,
  ...props
}) => {
  return (
    <Button
      className={cn(
        touchOptimized && 'min-h-[44px] min-w-[44px] touch-manipulation',
        'active:scale-95 transition-transform',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};