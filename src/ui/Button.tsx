import React from 'react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  className?: string
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-250 cursor-pointer active:scale-95 inline-flex items-center justify-center gap-2 select-none',
        // Variants
        variant === 'primary' && 'bg-accent text-bg hover:brightness-110 shadow-[0_0_15px_rgba(255,140,0,0.25)] border border-accent/20',
        variant === 'secondary' && 'bg-white/[0.03] text-text border border-white/5 hover:bg-white/[0.08] hover:border-white/10',
        variant === 'danger' && 'bg-danger text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,69,58,0.2)] border border-danger/20',
        // Sizes
        size === 'sm' && 'px-3 py-2 text-[10px]',
        size === 'md' && 'px-5 py-3',
        size === 'lg' && 'px-8 py-4 text-[13px]',
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
