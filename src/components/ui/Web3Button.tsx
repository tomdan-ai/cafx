import React from 'react';
import { cn } from '../../utils/cn';

interface Web3ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'web3' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  gradient?: string;
  children: React.ReactNode;
}

export const Web3Button: React.FC<Web3ButtonProps> = ({
  variant = 'web3',
  size = 'md',
  loading = false,
  gradient = 'from-purple-500 to-blue-500',
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 overflow-hidden group transform';
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/25 hover:scale-105',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white hover:scale-105',
    outline: 'border-2 border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white hover:bg-purple-500/10 hover:scale-105',
    ghost: 'text-gray-300 hover:text-white hover:bg-gray-700 hover:scale-105',
    web3: `bg-gradient-to-r ${gradient} text-white shadow-xl hover:shadow-2xl hover:scale-105 neon-glow`,
    neon: `bg-transparent border-2 border-purple-500 text-purple-400 hover:text-white hover:bg-purple-500 hover:shadow-purple-500/50 hover:shadow-2xl neon-border hover:scale-105`
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed scale-100',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Animated background overlay */}
      {variant === 'web3' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      )}
      
      {/* Neon glow effect */}
      {variant === 'neon' && (
        <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      )}
      
      {/* Loading spinner */}
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      <span className="relative z-10 flex items-center justify-center space-x-2">
        {children}
      </span>
      
      {/* Ripple effect */}
      <div className="absolute inset-0 opacity-0 group-active:opacity-100">
        <div className="absolute inset-0 bg-white/20 rounded-xl animate-ping"></div>
      </div>
    </button>
  );
};