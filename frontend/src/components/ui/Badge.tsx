import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-[#d4af37]/20 text-[#d4af37]': variant === 'default',
          'bg-emerald-500/20 text-emerald-400': variant === 'success',
          'bg-amber-500/20 text-amber-400': variant === 'warning',
          'bg-red-500/20 text-red-400': variant === 'destructive',
          'bg-[#1e3a5f] text-gray-300': variant === 'secondary',
          'border border-[#1e3a5f] bg-transparent text-gray-400': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
};
