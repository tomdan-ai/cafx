import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  web3?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  hover = false, 
  glow = false,
  web3 = false,
  onClick
}) => {
  return (
    <div
      className={cn(
        'bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6 transition-all duration-300 ease-in-out',
        hover && 'hover:bg-gray-800/70 hover:border-purple-500/50 hover:shadow-lg hover-lift cursor-pointer',
        glow && 'shadow-purple-500/20 hover:shadow-purple-500/40',
        web3 && 'neon-border holographic relative overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {web3 && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};