import React from 'react'

interface SectionTitleProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actionSlot?: React.ReactNode
  activeIndicator?: boolean
  compact?: boolean
}

export function SectionTitle({
  title,
  subtitle,
  icon,
  actionSlot,
  activeIndicator = false,
  compact = false
}: SectionTitleProps) {
  return (
    <div className={`flex items-center justify-between w-full ${compact ? 'mb-2' : 'mb-4'} select-none`}>
      <div className="flex items-center gap-3">
        {activeIndicator && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/60 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
        )}
        {icon && <span className="text-accent flex-shrink-0">{icon}</span>}
        <div className="flex flex-col">
          <h3 className="text-text font-black text-xs uppercase tracking-widest leading-none">
            {title}
          </h3>
          {subtitle && (
            <span className="font-mono text-[9px] text-accent mt-1 uppercase tracking-wider block">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
    </div>
  )
}
