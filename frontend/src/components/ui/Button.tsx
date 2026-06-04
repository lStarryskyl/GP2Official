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
            'bg-gradient-to-r from-[#1A6FD4] to-[#F97316] text-white hover:from-[#1558b0] hover:to-[#e0641a]': variant === 'default',
            'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
            'border border-[var(--brand-700)] bg-transparent text-gray-300 hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)] hover:bg-[#152238]': variant === 'outline',
            'bg-[var(--brand-700)] text-gray-200 hover:bg-[#2a4a6f]': variant === 'secondary',
            'bg-blue-500 text-white hover:bg-blue-600': variant === 'success',
            'bg-amber-500 text-white hover:bg-amber-600': variant === 'warning',
            'text-gray-300 hover:bg-[#152238] hover:text-[var(--blue-400)]': variant === 'ghost',
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
