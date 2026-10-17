import React from 'react';

export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const variantStyles = {
    default: 'bg-stone-100 text-stone-700 border-stone-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    brand: 'bg-brand-green-light text-brand-green border-brand-green/30',
    orange: 'bg-brand-orange-light text-brand-orange border-brand-orange/30',
  };

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-bold tracking-wide rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.sm}`}>
      {children}
    </span>
  );
}
