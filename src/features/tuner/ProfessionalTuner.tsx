import { useState, useEffect } from 'react'
import { AudioManager } from '../../core/audio/AudioManager'
import { PitchService, type NoteInfo } from '../../core/dsp/PitchService'
import { GlassPanel } from '../../ui/GlassPanel'

export const ProfessionalTuner = () => {
  const [noteInfo, setNoteInfo] = useState<NoteInfo | null>(null)

  useEffect(() => {
    const audioManager = AudioManager.getInstance()
    
    if (audioManager.getContext()?.state === 'suspended') {
      audioManager.resume()
    }
    
    audioManager.setOnPitchListener((pitch) => {
      const info = PitchService.getNoteFromFrequency(pitch)
      setNoteInfo(info)
    })

    return () => audioManager.setOnPitchListener(() => {})
  }, [])

  const isTuned = noteInfo && Math.abs(noteInfo.cents) < 5

  return (
    <GlassPanel className="flex flex-col items-center gap-8 w-full max-w-md select-none border-white/10" strong hoverEffect>
      
      {/* 1. Visual Needle Gauge Meter */}
      <div className="relative w-full h-32 flex items-end justify-center overflow-hidden">
        
        {/* Gauge Scale markings */}
        <div className="absolute inset-0 flex justify-between items-end px-4 pb-2 border-b border-white/5">
          {[-50, -25, 0, 25, 50].map(v => (
            <div key={v} className="flex flex-col items-center gap-1.5">
              <div className={`w-0.5 transition-all duration-300 ${v === 0 ? 'bg-accent h-6 shadow-[0_0_8px_var(--accent)]' : 'bg-white/10 h-2.5'}`}></div>
              <span className="text-[9px] font-mono font-bold text-text-muted">{v === 0 ? '▼' : v}</span>
            </div>
          ))}
        </div>

        {/* Needle gauge */}
        <div 
          className={`absolute w-0.75 h-24 origin-bottom transition-transform duration-150 ease-out rounded-full ${isTuned ? 'bg-success shadow-[0_0_15px_rgba(48,209,88,0.6)]' : 'bg-accent shadow-[0_0_10px_var(--accent-glow)]'}`}
          style={{ 
            transform: `rotate(${noteInfo ? (noteInfo.cents / 50) * 45 : 0}deg)`,
            bottom: '8px'
          }}
        ></div>
        
        {/* Needle pivot center point */}
        <div className="absolute bottom-1 w-3.5 h-3.5 bg-bg-elevated rounded-full border-2 border-white/15 z-10"></div>
      </div>

      {/* 2. Chromatic Note Display */}
      <div className="flex flex-col items-center font-mono">
        <div className="relative">
          <span className={`text-8xl font-black tracking-tighter transition-colors duration-300 ${isTuned ? 'text-success' : 'text-white'}`}>
            {noteInfo?.note || '--'}
          </span>
          <span className="absolute -top-1.5 -right-6 text-3xl font-extrabold text-text-soft">
            {noteInfo?.octave}
          </span>
        </div>
        
        <div className="mt-6 flex flex-col items-center gap-2">
          {/* Pitch frequency in Hz */}
          <span className="text-[11px] font-bold text-text-soft uppercase tracking-wider">
            {noteInfo ? `${noteInfo.frequency.toFixed(2)} Hz` : 'Esperando señal de tono...'}
          </span>
          
          {/* Cents deviation label */}
          <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${isTuned ? 'bg-success/10 text-success border-success/20 animate-pulse' : 'bg-accent/10 text-accent border-accent/20'}`}>
            {noteInfo ? (noteInfo.cents > 0 ? `+${noteInfo.cents} Cents` : `${noteInfo.cents} Cents`) : 'Afinado'}
          </div>
        </div>
      </div>

    </GlassPanel>
  )
}
