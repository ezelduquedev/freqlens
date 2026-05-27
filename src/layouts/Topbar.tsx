import { Settings } from 'lucide-react'
import { IconButton } from '../ui/IconButton'

interface TopbarProps {
  engineRunning: boolean
  toggleEngine: () => void
  activeTabLabel: string
  onSettingsClick: () => void
}

export function Topbar({
  engineRunning,
  toggleEngine,
  activeTabLabel,
  onSettingsClick,
}: TopbarProps) {
  return (
    <header className="w-full h-14 lg:h-16 flex-shrink-0 border-b border-border-custom bg-panel/30 backdrop-blur-md flex items-center justify-between px-3 lg:px-6 z-50 select-none">
      {/* Left: brand + active tab */}
      <div className="flex items-center gap-2 lg:gap-4 min-w-0">
        {/* Logo mark — only on mobile since sidebar is hidden */}
        <div className="lg:hidden w-7 h-7 flex-shrink-0 flex items-center justify-center drop-shadow-[0_0_8px_var(--accent-glow)]">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="40" stroke="var(--accent)" strokeWidth="6" fill="none" />
            <path d="M 22 62 Q 35 62 42 45 Q 50 25 58 45 Q 65 62 78 62" stroke="var(--text)" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="48" r="5" fill="var(--text)" />
          </svg>
        </div>

        <span className="hidden lg:block text-sm font-black uppercase tracking-widest text-text-main font-mono">
          CONSOLA
        </span>
        <div className="hidden lg:block h-4 w-px bg-border-custom" />
        <span className="mono text-[9px] lg:text-[10px] uppercase font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20 truncate max-w-[160px] lg:max-w-none">
          {activeTabLabel}
        </span>
      </div>

      {/* Center: status badges — only on large screens */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 bg-bg-elevated border border-border-custom px-3 py-1.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span>ENTRADA: {engineRunning ? 'ACTIVO (MIC)' : 'EN ESPERA'}</span>
        </div>
        <div className="flex items-center gap-2 bg-bg-elevated border border-border-custom px-3 py-1.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider text-text-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-text-soft/30" />
          <span>NODO DSP: 100% LOCAL</span>
        </div>
      </div>

      {/* Right: engine toggle + settings */}
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        {/* Engine button — compact on mobile */}
        <button
          onClick={toggleEngine}
          className={`font-mono text-[8px] lg:text-[9px] font-black uppercase tracking-wider px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,140,0,0.2)] ${
            engineRunning
              ? 'bg-accent text-black hover:bg-accent/90'
              : 'bg-bg-elevated border border-border-custom text-text-main hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          <span className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full border border-current flex items-center justify-center text-[5px]">
            {'\u25CF'}
          </span>
          <span className="hidden sm:inline">
            {engineRunning ? 'DETENER' : 'INICIAR'}
          </span>
          <span className="sm:hidden">
            {engineRunning ? 'OFF' : 'ON'}
          </span>
        </button>

        <IconButton
          icon={<Settings className="w-4 h-4" />}
          variant="ghost"
          size="sm"
          title="Configuracion"
          onClick={onSettingsClick}
        />
      </div>
    </header>
  )
}
