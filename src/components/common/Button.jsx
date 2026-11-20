import React from 'react';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary | secondary | danger | success | ghost | outline
  size = 'md', // sm | md | lg
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variants = {
    primary: 'bg-[#7542C8] hover:bg-[#6334B0] active:bg-[#582CA1] text-white shadow-sm shadow-purple-200 dark:shadow-none',
    secondary: 'bg-purple-50 dark:bg-purple-950/40 text-[#7542C8] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40',
    success: 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm shadow-green-200 dark:shadow-none',
    danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm shadow-red-200 dark:shadow-none',
    ghost: 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5',
    outline: 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
};
