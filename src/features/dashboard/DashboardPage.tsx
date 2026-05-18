import { Sparkles, Play, Award, Volume2 } from 'lucide-react'
import { ProfessionalSpectrum } from '../analyzer/ProfessionalSpectrum'
import { AdaptiveEQControls } from '../eq/AdaptiveEQControls'
import { GlassPanel } from '../../ui/GlassPanel'
import { Button } from '../../ui/Button'
import { SectionTitle } from '../../ui/SectionTitle'
import { Stat } from '../../ui/Stat'

interface DashboardPageProps {
  onRunWizard: () => void
  onUpdateEQ: () => void
}

export function DashboardPage({ onRunWizard, onUpdateEQ }: DashboardPageProps) {
  return (
    <div className="flex flex-col gap-2 h-full min-h-0 fade-in">

      {/* TOP: Split 3/4 + 1/4 — Spectrum left, cards right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-stretch min-h-0">

        {/* LEFT: Widescreen RTA Spectrum (3/4) */}
        <div className="lg:col-span-3 h-[200px] lg:h-[230px] relative">
          <ProfessionalSpectrum />
        </div>

        {/* RIGHT: Stacked info cards (1/4) */}
        <div className="lg:col-span-1 flex flex-col gap-2 min-h-0 h-[200px] lg:h-[230px] overflow-y-hidden no-scrollbar">

          {/* Smart Recommendation */}
          <GlassPanel className="flex flex-col flex-shrink-0 !p-1.5" hoverEffect>
            <SectionTitle
              title="Recomendación"
              subtitle="Análisis acústico"
              icon={<Sparkles className="w-3 h-3 text-accent" />}
              compact
            />
            <p className="text-[8px] text-text-soft leading-snug italic bg-white/[0.01] px-1.5 py-1 rounded border border-white/5 mt-1 font-mono">
              "Exceso de energía en 125Hz. Resonancias modales en graves."
            </p>
          </GlassPanel>

          {/* Calibration shortcut */}
          <GlassPanel className="flex flex-col flex-shrink-0 !p-2" hoverEffect>
            <SectionTitle
              title="Calibración"
              subtitle="Respuesta al impulso"
              icon={<Volume2 className="w-3 h-3 text-accent" />}
              compact
            />
            <div className="flex items-center justify-between w-full mt-1">
              <div>
                <span className="mono text-[7px] text-text-muted uppercase tracking-widest block font-bold">Estado</span>
                <span className="mono text-[8px] text-accent uppercase font-black tracking-widest block">LISTO</span>
              </div>
              <Button variant="primary" size="sm" onClick={onRunWizard} icon={<Play className="w-3 h-3" />}>
                Iniciar
              </Button>
            </div>
          </GlassPanel>

          {/* Session Motor Stats */}
          <GlassPanel className="flex flex-col flex-shrink-0 !p-2" hoverEffect>
            <SectionTitle
              title="Motor de Audio"
              subtitle="Latencia web"
              icon={<Award className="w-3 h-3 text-accent" />}
              compact
            />
            <div className="grid grid-cols-3 gap-1 mt-1">
              <Stat label="Sample" value="48kHz" sub="OK" compact />
              <Stat label="Bits" value="32-bit" sub="LOSSLESS" compact />
              <Stat label="Buffer" value="Low" accent sub="STABLE" compact />
            </div>
          </GlassPanel>

        </div>
      </div>

      {/* BOTTOM: Full-width Parametric EQ Fader Bar */}
      <div className="flex-shrink-0 w-full">
        <AdaptiveEQControls onUpdate={onUpdateEQ} />
      </div>

    </div>
  )
}
