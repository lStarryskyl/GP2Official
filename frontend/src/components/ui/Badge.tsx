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
          'bg-[var(--blue-400)]/20 text-[var(--blue-400)]': variant === 'default',
<<<<<<< HEAD
          'bg-blue-900/200/20 text-blue-400': variant === 'success',
=======
          'bg-blue-900/20 text-blue-400': variant === 'success',
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
          'bg-amber-500/20 text-amber-400': variant === 'warning',
          'bg-red-500/20 text-red-400': variant === 'destructive',
          'bg-[var(--brand-700)] text-gray-300': variant === 'secondary',
          'border border-[var(--brand-700)] bg-transparent text-gray-400': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
};
