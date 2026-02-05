import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'stat';
  statColor?: 'purple' | 'blue' | 'green' | 'yellow';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  glow = false,
  variant = 'default',
  statColor,
  onClick
}) => {
  const baseStyles = 'rounded-xl transition-all duration-300 ease-out';

  const variants = {
    default: 'bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-6',
    elevated: 'card-elevated p-4 sm:p-6',
    glass: 'card-glass p-4 sm:p-6',
    stat: cn(
      'stat-card',
      statColor === 'purple' && 'stat-card-purple',
      statColor === 'blue' && 'stat-card-blue',
      statColor === 'green' && 'stat-card-green',
      statColor === 'yellow' && 'stat-card-yellow'
    )
  };

  const hoverStyles = hover
    ? 'hover:border-[var(--color-border-light)] hover:transform hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
    : '';

  const glowStyles = glow
    ? 'hover:border-[var(--color-primary)] hover:shadow-[0_0_20px_rgba(127,90,240,0.15)]'
    : '';

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        hoverStyles,
        glowStyles,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};