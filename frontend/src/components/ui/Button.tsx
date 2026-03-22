import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary' | 'success' | 'warning';
  size?: 'xs' | 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-gradient-to-r from-[#4ade80] to-[#b8962e] text-[#0a150e] hover:from-[#e6c358] hover:to-[#4ade80]': variant === 'default',
            'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
            'border border-[#1e4a28] bg-transparent text-gray-300 hover:border-[#4ade80]/50 hover:text-[#4ade80] hover:bg-[#152238]': variant === 'outline',
            'bg-[#1e4a28] text-gray-200 hover:bg-[#2a4a6f]': variant === 'secondary',
            'bg-emerald-600 text-white hover:bg-emerald-700': variant === 'success',
            'bg-amber-500 text-white hover:bg-amber-600': variant === 'warning',
            'text-gray-300 hover:bg-[#152238] hover:text-[#4ade80]': variant === 'ghost',
            'h-9 px-3 text-xs': size === 'xs',
            'h-10 px-4 py-2': size === 'default',
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-8': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
