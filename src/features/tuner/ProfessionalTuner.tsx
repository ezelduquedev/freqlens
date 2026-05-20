import { useState, useEffect } from 'react'
import { AudioManager } from '../../core/audio/AudioManager'
import { PitchService, type NoteInfo } from '../../core/dsp/PitchService'

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
    <div className="flex flex-col items-center justify-center gap-10 w-full max-w-lg select-none font-mono h-full min-h-[400px]">
      
      {/* 1. Visual Cents Needle Gauge Meter exactly like the mock */}
      <div className="relative w-full h-36 flex items-end justify-center select-none">
        
        {/* Gauge Scale markings */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between items-end px-4 pb-2 border-b border-white/5">
          {[-50, -25, 0, 25, 50].map(v => (
            <div key={v} className="flex flex-col items-center gap-2">
              <div className={`w-0.5 transition-all duration-300 ${
                v === 0 
                  ? 'bg-accent h-6 shadow-[0_0_8px_rgba(255,140,0,0.8)]' 
                  : 'bg-white/10 h-3.5'
              }`} />
              <span className="text-[10px] font-bold text-text-muted">{v === 0 ? '0' : v > 0 ? `${v}` : `${v}`}</span>
            </div>
          ))}
        </div>

        {/* Dynamic needle pointer */}
        <div 
          className={`absolute w-0.75 h-28 origin-bottom transition-all duration-150 ease-out rounded-full ${
            isTuned 
              ? 'bg-success shadow-[0_0_15px_rgba(48,209,88,0.6)]' 
              : 'bg-accent shadow-[0_0_12px_rgba(255,140,0,0.8)]'
          }`}
          style={{ 
            transform: `rotate(${noteInfo ? (noteInfo.cents / 50) * 45 : 0}deg)`,
            bottom: '8px'
          }}
        />
        
        {/* Needle pivot center point */}
        <div className="absolute bottom-1 w-3.5 h-3.5 bg-black rounded-full border-2 border-accent z-10" />
      </div>

      {/* 2. Chromatic Note Display Area */}
      <div className="flex flex-col items-center gap-6 font-mono text-center">
        {noteInfo ? (
          <div className="relative leading-none">
            <span className={`text-8xl font-black tracking-tighter ${isTuned ? 'text-success' : 'text-white'}`}>
              {noteInfo.note}
            </span>
            <span className="absolute -top-2 -right-6 text-3.5xl font-extrabold text-text-muted">
              {noteInfo.octave}
            </span>
          </div>
        ) : (
          /* When waiting, render the two wide horizontal rectangles side-by-side */
          <div className="flex items-center gap-3.5 h-16 py-3 select-none">
            <div className="w-10 h-2.5 bg-border-strong rounded-sm" />
            <div className="w-10 h-2.5 bg-border-strong rounded-sm" />
          </div>
        )}
        
        {/* Pitch frequency in Hz status text */}
        <div className="text-[11px] font-black text-text-muted tracking-widest uppercase mt-4">
          {noteInfo ? `${noteInfo.frequency.toFixed(2)} Hz` : 'ESPERANDO SEÑAL DE TONO...'}
        </div>
        
        {/* Lower pill badge exactly matching mockup */}
        <button className="mono text-[8px] uppercase tracking-widest font-black text-accent hover:text-white transition-colors bg-accent/5 border border-accent/20 px-4 py-1.5 rounded-full cursor-default mt-2">
          {noteInfo ? (noteInfo.cents > 0 ? `+${noteInfo.cents.toFixed(0)} CENTS` : `${noteInfo.cents.toFixed(0)} CENTS`) : 'AFINADO'}
        </button>
      </div>

    </div>
  )
}
