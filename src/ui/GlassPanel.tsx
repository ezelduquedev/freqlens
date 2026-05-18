import React from 'react'
import clsx from 'clsx'

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  strong?: boolean
  hoverEffect?: boolean
}

export function GlassPanel({
  children,
  className = '',
  strong = false,
  hoverEffect = false,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={clsx(
        strong ? 'glass-strong' : 'glass',
        'rounded-[24px] border border-white/5 shadow-2xl p-6 transition-all duration-300',
        hoverEffect && 'hover:border-accent/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(255,140,0,0.06)] hover:translate-y-[-2px]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
