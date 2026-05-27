import { Mic } from 'lucide-react'
import { ProfessionalSpectrum } from '../analyzer/ProfessionalSpectrum'
import { AdaptiveEQControls } from '../eq/AdaptiveEQControls'
import { EQPresets } from '../eq/EQPresets'
import { GlassPanel } from '../../ui/GlassPanel'
import { RoomProfileStorage } from '../../core/audio/RoomProfileStorage'
import { loadSettings } from '../settings/SettingsPanel'
import { useState, useEffect } from 'react'
import { RMSMeter } from './RMSMeter'

interface DashboardPageProps {
  onRunWizard: () => void
  onUpdateEQ: () => void
}

export function DashboardPage({ onRunWizard, onUpdateEQ }: DashboardPageProps) {
  const [activeProfileName, setActiveProfileName] = useState('MASTER CONTROL ROOM B')
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    const refresh = () => setSettings(loadSettings())
    window.addEventListener('freqlens-settings-changed', refresh)
    return () => window.removeEventListener('freqlens-settings-changed', refresh)
  }, [])

  const latencyLabel = settings.smoothingTimeConstant >= 0.9 ? 'Alta' : settings.smoothingTimeConstant >= 0.7 ? 'Media' : 'Baja'
  const latencyColor = settings.smoothingTimeConstant >= 0.9 ? 'text-accent' : settings.smoothingTimeConstant >= 0.7 ? 'text-success' : 'text-blue-400'

  useEffect(() => {
    const profiles = RoomProfileStorage.getAllProfiles()
    if (profiles.length > 0) setActiveProfileName(profiles[0].name.toUpperCase())
  }, [onUpdateEQ])

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-3 lg:h-[calc(100vh-112px)] min-h-0 fade-in select-none">
      <div className="lg:col-span-3 flex flex-col gap-2 min-h-0 h-full">
        <div className="flex-grow min-h-0 relative rounded-2xl overflow-hidden border border-border-custom bg-black/20">
          <ProfessionalSpectrum />
        </div>
        <div className="flex-shrink-0">
          <AdaptiveEQControls onUpdate={onUpdateEQ} />
        </div>
      </div>
      <div className="lg:col-span-1 flex flex-col gap-2.5 min-h-0 h-full overflow-y-hidden no-scrollbar pr-0.5">
        <div className="flex-shrink-0"><RMSMeter /></div>
        <div className="flex-grow min-h-0 bg-panel border border-border-custom rounded-2xl p-3 overflow-hidden">
          <EQPresets onPresetApply={onUpdateEQ} variant="compact" />
        </div>
        <GlassPanel className="flex flex-col flex-shrink-0 !p-3 border-border-custom bg-panel/30" hoverEffect>
          <div className="flex items-center gap-2 mb-2.5">
            <Mic className="w-4 h-4 text-accent animate-pulse" />
            <div>
              <h4 className="text-[9.5px] font-black text-text-main uppercase tracking-wider leading-none">ASISTENTE DE CALIBRACIÓN</h4>
              <span className="text-[7.5px] text-accent uppercase tracking-widest block mt-1 font-bold">CORRECCIÓN ACÚSTICA FÍSICA</span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full mb-3 font-mono select-none">
            <div className="min-w-0">
              <span className="mono text-[6.5px] text-text-muted uppercase tracking-widest block font-bold">ÚLTIMA MEDICIÓN</span>
              <span className="mono text-[9.5px] uppercase font-black tracking-tight text-text-main block mt-1 truncate max-w-[150px]">{activeProfileName}</span>
            </div>
            <button onClick={onRunWizard} className="bg-accent hover:bg-accent/90 text-white dark:text-black font-extrabold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all uppercase tracking-wider text-[9px] cursor-pointer shadow-[0_0_12px_rgba(255,140,0,0.2)]">
              <span className="text-[8px]">▶</span> CALIBRAR
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 border-t border-border-custom pt-2.5 text-center font-mono">
            <div className="bg-bg-elevated border border-border-custom py-1 px-1.5 rounded-lg">
              <span className="text-[6.5px] text-text-soft uppercase tracking-tighter block font-bold">SAMPLE</span>
              <span className="text-[8.5px] text-text-main font-extrabold block mt-0.5">48 kHz</span>
            </div>
            <div className="bg-bg-elevated border border-border-custom py-1 px-1.5 rounded-lg">
              <span className="text-[6.5px] text-text-soft uppercase tracking-tighter block font-bold">FFT</span>
              <span className="text-[8.5px] text-accent font-extrabold block mt-0.5">{settings.fftSize}</span>
            </div>
            <div className="bg-bg-elevated border border-border-custom py-1 px-1.5 rounded-lg">
              <span className="text-[6.5px] text-text-soft uppercase tracking-tighter block font-bold">LATENCIA</span>
              <span className={`text-[8.5px] font-extrabold block mt-0.5 ${latencyColor}`}>{latencyLabel}</span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}