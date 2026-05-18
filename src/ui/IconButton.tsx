import React from 'react'
import clsx from 'clsx'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  variant?: 'panel' | 'accent' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  className?: string
}

export function IconButton({
  icon,
  variant = 'panel',
  size = 'md',
  active = false,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90',
        // Variants
        variant === 'panel' && [
          'border border-white/5',
          active
            ? 'bg-accent/10 border-accent/30 text-accent shadow-[0_0_12px_rgba(255,140,0,0.15)]'
            : 'bg-white/[0.03] text-text-soft hover:bg-white/[0.08] hover:text-text hover:border-white/10'
        ],
        variant === 'accent' && 'bg-accent text-bg hover:brightness-110 shadow-[0_0_12px_rgba(255,140,0,0.25)]',
        variant === 'ghost' && [
          'border border-transparent',
          active ? 'text-accent' : 'text-text-soft hover:text-text hover:bg-white/[0.04]'
        ],
        // Sizes
        size === 'sm' && 'p-1.5 text-sm',
        size === 'md' && 'p-2.5 text-base',
        size === 'lg' && 'p-3.5 text-lg',
        className
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
