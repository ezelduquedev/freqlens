/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { AdaptiveEQManager, type EQBand } from '../../core/audio/AdaptiveEQManager'
import { Sliders } from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel'
import { SectionTitle } from '../../ui/SectionTitle'

export const AdaptiveEQControls = ({ onUpdate }: { onUpdate?: () => void }) => {
  const [bands, setBands] = useState<EQBand[]>([])
  const eqManager = AdaptiveEQManager.getInstance()

  useEffect(() => {
    setBands([...eqManager.getBands()])
  }, [])

  const handleGainChange = (id: string, gain: number) => {
    eqManager.setBandGain(id, gain)
    setBands([...eqManager.getBands()])
    if (onUpdate) onUpdate()
  }

  const resetBands = () => {
    bands.forEach(band => {
      eqManager.setBandGain(band.id, 0)
    })
    setBands([...eqManager.getBands()])
    if (onUpdate) onUpdate()
  }

  return (
    <GlassPanel hoverEffect>
      <SectionTitle
        title="Control de Ecualización Paramétrica"
        subtitle="Bandas de Compensación de Sala Activas"
        icon={<Sliders className="w-4 h-4 text-accent" />}
        compact
        actionSlot={
          <button 
            onClick={resetBands}
            className="mono text-[9px] uppercase tracking-widest font-bold text-text-muted hover:text-accent transition-colors bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            Restablecer
          </button>
        }
      />
      
      {/* Compact horizontal fader strip */}
      <div className="flex gap-2 sm:gap-3 justify-between py-0.5">
        {bands.map(band => (
          <div key={band.id} className="flex flex-col items-center gap-2 select-none">
            {/* Custom high-end DAW vertical range track */}
            <div className="relative h-10 w-1 bg-bg-elevated border border-white/5 rounded-full overflow-visible flex items-center justify-center">
              
              {/* Center 0dB indicator tick mark */}
              <div className="absolute w-3 h-0.5 bg-white/10 z-0" style={{ top: '50%' }} />

              {/* Highlight active gain fill bar growing up/down from 0dB center line */}
              <div 
                className="absolute w-full bg-accent/35 rounded-full transition-all duration-100 shadow-[0_0_8px_var(--accent-glow)] z-10"
                style={
                  band.gain >= 0
                    ? { bottom: '50%', height: `${(band.gain / 24) * 100}%` }
                    : { bottom: `${((band.gain + 12) / 24) * 100}%`, height: `${(-band.gain / 24) * 100}%` }
                }
              />

              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={band.gain}
                onChange={(e) => handleGainChange(band.id, parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full appearance-none bg-transparent daw-fader z-20"
              />
            </div>
            
            {/* Band description metrics */}
            <div className="text-center font-mono">
              <div className="text-[7px] font-black text-text-muted uppercase tracking-wider leading-none">
                {band.id}
              </div>
              <div className="text-[8px] text-accent font-bold leading-none mt-0.5">
                {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
              </div>
              <div className="text-[7px] text-text-soft leading-none mt-0.5">
                {band.frequency < 1000 ? `${band.frequency}Hz` : `${(band.frequency / 1000).toFixed(1)}k`}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Inline status strip */}
      <div className="mt-2 flex items-center justify-between">
        <span className="mono text-[8px] text-text-muted uppercase tracking-widest font-bold">Corrección DSP Activa</span>
        <span className="mono text-[8px] text-success font-bold bg-success/10 px-2 py-0.5 rounded border border-success/20">NODO ACTIVO</span>
      </div>
    </GlassPanel>
  )
}
