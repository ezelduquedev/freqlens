import clsx from 'clsx'

interface StatProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  className?: string
  compact?: boolean
}

export function Stat({
  label,
  value,
  sub,
  accent = false,
  className = '',
  compact = false
}: StatProps) {
  return (
    <div
      className={clsx(
        compact
          ? 'p-1.5 rounded-xl border bg-white/[0.02] border-white/5 flex flex-col transition-all duration-200 hover:border-white/10'
          : 'p-5 rounded-2xl border bg-white/[0.02] border-white/5 flex flex-col justify-between transition-all duration-200 hover:border-white/10',
        className
      )}
    >
      <div>
        <span className={clsx('mono uppercase tracking-widest text-text-muted font-bold block', compact ? 'text-[7px] mb-0.5' : 'text-[10px] mb-1')}>
          {label}
        </span>
        <span
          className={clsx(
            'font-extrabold tracking-tight block transition-colors',
            compact ? 'text-xs mt-0' : 'text-2xl mt-1',
            accent ? 'text-accent' : 'text-text'
          )}
        >
          {value}
        </span>
      </div>
      {sub && (
        <span className={clsx('mono text-text-soft block uppercase tracking-tighter', compact ? 'text-[7px] mt-0.5' : 'text-[10px] mt-3')}>
          {sub}
        </span>
      )}
    </div>
  )
}
