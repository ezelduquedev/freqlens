/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { AdaptiveEQManager, type EQBand } from '../../core/audio/AdaptiveEQManager'

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

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
      <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
        Parametric EQ Control
      </h3>
      
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-4 sm:gap-6 justify-between">
        {bands.map(band => (
          <div key={band.id} className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-1.5 bg-slate-800 rounded-full overflow-hidden">
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={band.gain}
                onChange={(e) => handleGainChange(band.id, parseFloat(e.target.value))}
                className="absolute w-40 h-2 -rotate-90 origin-center cursor-pointer appearance-none bg-transparent accent-cyan-400 z-10"
                style={{ 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%) rotate(-90deg)',
                  width: '160px' 
                }}
              />
              <div 
                className="absolute bottom-0 w-full bg-cyan-500/40 transition-all duration-100 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                style={{ height: `${((band.gain + 12) / 24) * 100}%` }}
              />
            </div>
            
            <div className="text-center">
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter mb-0.5">{band.id}</div>
              <div className="text-[10px] font-mono text-cyan-400 font-bold">{band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}</div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">{band.frequency < 1000 ? `${band.frequency}Hz` : `${(band.frequency / 1000).toFixed(1)}k`}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col gap-4">
        <div className="flex justify-between items-center">
           <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
             Real-time Correction
           </span>
           <span className="text-[9px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
             ACTIVE
           </span>
        </div>
      </div>
    </div>
  )
}
