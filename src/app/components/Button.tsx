'use client';

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  icon?: string;
  position?: 'fixed' | 'static';
  customPosition?: string;
}

export default function Button({
  children,
  variant = 'primary',
  icon,
  position = 'static',
  customPosition,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = `
    ${position === 'fixed' ? 'fixed bottom-8 left-8' : ''} 
    ${customPosition || ''}
    z-50 
    px-6 py-2 sm:px-8 sm:py-4
    font-pixel
    text-sm sm:text-base
    transition-all
    duration-100
    rounded-lg
    disabled:opacity-50
    ${className}
  `;

  const variants = {
    primary: `
      border-2 border-[#2A5E1C] 
      bg-gradient-to-b from-[#4a934c] to-[#2A5E1C]
      text-[#E8DAB2] 
      shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]
      hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]
      hover:scale-[0.98]
      transform-gpu
      [image-rendering:pixelated]
    `,
    secondary: `
      bg-foreground 
      text-background 
      hover:bg-opacity-90
    `
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
