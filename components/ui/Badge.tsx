'use client';

import * as React from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const getVariantClasses = (variant: BadgeVariant = 'default') => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  
  switch (variant) {
    case 'primary':
      return `${baseClasses} border-transparent bg-blue-500 text-white hover:bg-blue-600`;
    case 'secondary':
      return `${baseClasses} border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200`;
    case 'destructive':
    case 'danger':
      return `${baseClasses} border-transparent bg-red-500 text-white hover:bg-red-600`;
    case 'outline':
      return `${baseClasses} border-gray-300 text-gray-700 bg-white hover:bg-gray-50`;
    case 'ghost':
      return `${baseClasses} border-transparent bg-transparent text-gray-700 hover:bg-gray-100`;
    default:
      return `${baseClasses} border-transparent bg-blue-500 text-white hover:bg-blue-600`;
  }
};

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variantClasses = getVariantClasses(variant);
  const combinedClasses = `${variantClasses} ${className}`.trim();
  
  return (
    <div className={combinedClasses} {...props} />
  );
}

export { Badge };
