import clsx from 'clsx'
import {
  Settings,
  Mic,
  Cpu,
  Play,
  Square
} from 'lucide-react'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'

interface TopbarProps {
  engineRunning: boolean
  toggleEngine: () => void
  activeTabLabel: string
}

export function Topbar({
  engineRunning,
  toggleEngine,
  activeTabLabel
}: TopbarProps) {
  return (
    <header className="w-full h-16 flex-shrink-0 border-b border-white/5 bg-black/10 backdrop-blur-md flex items-center justify-between px-6 z-50 select-none">
      {/* Title / Section */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-black uppercase tracking-widest text-text font-mono">
          Consola
        </span>
        <div className="h-4 w-px bg-white/10" />
        <span className="mono text-[10px] uppercase font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
          {activeTabLabel}
        </span>
      </div>

      {/* Center Console Telemetry Displays */}
      <div className="hidden lg:flex items-center gap-6 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-full">
        {/* Mic telemetry */}
        <div className="flex items-center gap-2">
          <Mic className={clsx('w-3.5 h-3.5', engineRunning ? 'text-accent' : 'text-text-muted')} />
          <span className="mono text-[10px] uppercase font-semibold text-text-soft">
            Entrada:
          </span>
          <span className={clsx('mono text-[10px] font-bold', engineRunning ? 'text-success' : 'text-text-muted')}>
            {engineRunning ? 'ACTIVO (MIC)' : 'EN ESPERA'}
          </span>
        </div>

        <div className="w-px h-3 bg-white/10" />

        {/* DSP Telemetry */}
        <div className="flex items-center gap-2">
          <Cpu className={clsx('w-3.5 h-3.5', engineRunning ? 'text-accent' : 'text-text-muted')} />
          <span className="mono text-[10px] uppercase font-semibold text-text-soft">
            Nodo DSP:
          </span>
          <span className="mono text-[10px] text-text-muted">
            100% LOCAL (WASM)
          </span>
        </div>
      </div>

      {/* Toolbar / Actions */}
      <div className="flex items-center gap-3">
        {/* Toggle Button */}
        <Button
          variant={engineRunning ? 'danger' : 'primary'}
          size="sm"
          onClick={toggleEngine}
          icon={engineRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        >
          {engineRunning ? 'Detener Motor' : 'Iniciar Motor'}
        </Button>

        {/* Settings button */}
        <IconButton
          icon={<Settings className="w-4 h-4" />}
          variant="ghost"
          size="sm"
          title="Configuración"
        />
      </div>
    </header>
  )
}
