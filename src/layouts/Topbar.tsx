interface TopbarProps {
  engineRunning: boolean
  toggleEngine: () => void
  activeTabLabel: string
}

export function Topbar({
  engineRunning,
  toggleEngine,
  activeTabLabel,
}: TopbarProps) {
  return (
    <header className="w-full h-16 flex-shrink-0 border-b border-border-custom bg-panel/30 backdrop-blur-md flex items-center justify-between px-6 z-50 select-none">
      <div className="flex items-center gap-4">
        <span className="text-sm font-black uppercase tracking-widest text-text-main font-mono">
          CONSOLA
        </span>
        <div className="h-4 w-px bg-border-custom" />
        <span className="mono text-[10px] uppercase font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
          {activeTabLabel}
        </span>
      </div>

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

      <div className="flex items-center gap-3">
        <button
          onClick={toggleEngine}
          className={`font-mono text-[9px] font-black uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,140,0,0.2)] ${
            engineRunning
              ? 'bg-accent text-black hover:bg-accent/90'
              : 'bg-bg-elevated border border-border-custom text-text-main hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full border border-current flex items-center justify-center text-[5px]">
            {'\u25CF'}
          </span>
          {engineRunning ? 'DETENER MOTOR' : 'INICIAR MOTOR'}
        </button>
      </div>
    </header>
  )
}