/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { AdaptiveEQManager, type EQBand } from '../../core/audio/AdaptiveEQManager'
import { Sliders } from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel'
import { RoomProfileStorage, type RoomProfile } from '../../core/audio/RoomProfileStorage'
import { onEQUpdate } from '../../core/audio/EQEventBus'

export const AdaptiveEQControls = ({ onUpdate }: { onUpdate?: () => void }) => {
  const [bands, setBands] = useState<EQBand[]>([])
  const [activeProfile, setActiveProfile] = useState<RoomProfile | null>(null)
  const eqManager = AdaptiveEQManager.getInstance()

  const loadProfile = () => {
    const list = RoomProfileStorage.getAllProfiles()
    if (list.length > 0) {
      setActiveProfile(list[0])
    } else {
      setActiveProfile(null)
    }
  }

  useEffect(() => {
    loadProfile()
    setBands([...eqManager.getBands()])

    const unsubscribe = onEQUpdate(() => {
      setBands([...eqManager.getBands()])
      loadProfile()
      if (onUpdate) onUpdate()
    })
    return () => unsubscribe()
  }, [onUpdate])

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

  const applyOptimalCalibration = () => {
    if (!activeProfile) return
    Object.entries(activeProfile.eqValues).forEach(([id, targetGain]) => {
      eqManager.setBandGain(id, targetGain)
    })
    setBands([...eqManager.getBands()])
    if (onUpdate) onUpdate()
  }

  return (
    <GlassPanel className="!p-4 flex flex-col gap-4 flex-shrink-0 border-border-custom bg-panel/30" hoverEffect>
      {/* Header Info */}
      <div className="flex justify-between items-center select-none font-mono flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-accent" />
          <div>
            <h4 className="text-[10px] font-black text-text-main uppercase tracking-wider leading-none">
              CORRECCIÓN DE SALA PARAMÉTRICA
            </h4>
            <span className="text-[7.5px] text-text-muted uppercase tracking-widest block mt-1 font-bold">
              {activeProfile 
                ? `GUÍA ACTIVA: COMPENSACIÓN PARA ${activeProfile.name.toUpperCase()}`
                : 'FILTROS DE FASE LINEAL NEUTROS (±6 DB RECOMENDADO)'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 font-mono">
          {activeProfile && (
            <button 
              onClick={applyOptimalCalibration}
              className="mono text-[8px] uppercase tracking-widest font-black text-accent hover:text-white transition-colors bg-accent/10 border border-accent/20 px-3 py-1 rounded cursor-pointer"
              title="Alinear automáticamente todas las bandas con la calibración física calculada de la sala"
            >
              OPTIMIZAR SALA
            </button>
          )}
          <button 
            onClick={resetBands}
            className="mono text-[8px] uppercase tracking-widest font-black text-text-soft hover:text-accent transition-colors bg-bg-elevated border border-border-custom px-3 py-1 rounded cursor-pointer"
          >
            RESTABLECER
          </button>
        </div>
      </div>

      {/* Faders strip: grouped exactly as mock */}
      <div className="grid grid-cols-5 gap-4 py-2 max-w-2xl mx-auto w-full">
        {bands.map(band => {
          // Map -12..12 scale to 0..100 percentage position for user fader knob
          const percent = ((band.gain + 12) / 24) * 100

          // Calculate recommended target position from active calibrated room profile
          const targetGain = activeProfile ? (activeProfile.eqValues[band.id] ?? 0) : 0

          return (
            <div key={band.id} className="flex flex-col items-center gap-4 select-none">
              {/* DAW Vertical Fader Slot: Tall & elegant */}
              <div className="relative h-[120px] w-0.75 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center">
                
                {/* Center 0dB indicator tick */}
                <div className="absolute left-[-4px] right-[-4px] h-0.5 bg-black/20 dark:bg-white/20 z-0" style={{ top: '50%' }} />

                {/* Custom glowing orange ring knob with dark inset border and center orange dot */}
                <div 

                  className="absolute w-4 h-4 rounded-full border-[3px] border-black/90 bg-accent shadow-[0_0_0_1.5px_#ff8c00,0_0_10px_rgba(255,140,0,0.8)] z-10 pointer-events-none transition-all duration-75"
                  style={{ 
                    bottom: `calc(${percent}% - 8px)` // Center the 16px knob (8px offset)
                  }}
                />

                {/* Native Range input hidden but active */}
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.1"
                  value={band.gain}
                  onChange={(e) => handleGainChange(band.id, parseFloat(e.target.value))}
                  className="absolute inset-0 w-8 h-full appearance-none bg-transparent opacity-0 z-20 cursor-ns-resize -ml-3.5"
                />
              </div>
              
              {/* Band description metrics exactly like mockup */}
              <div className="text-center font-mono w-full select-none">
                <div className="text-[9px] font-black text-text-soft uppercase tracking-wider leading-none">
                  {band.id.replace('-shelf', '').toUpperCase()}
                </div>
                <div className="text-[10.5px] text-accent font-extrabold leading-none mt-1.5">
                  {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
                </div>
                {/* Target objective indicator text */}
                <div className="text-[7.5px] text-text-muted mt-1 uppercase font-bold tracking-tight">
                  {activeProfile ? `TGT: ${targetGain > 0 ? '+' : ''}${targetGain.toFixed(1)}` : 'TGT: 0.0'}
                </div>
                <div className="text-[8px] text-text-muted leading-none mt-1.5 font-bold">
                  {band.frequency < 1000 ? `${band.frequency}Hz` : `${(band.frequency / 1000).toFixed(0)}k`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}
