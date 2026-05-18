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
    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center gap-8 w-full max-w-md">
      {/* Visual Needle Meter */}
      <div className="relative w-full h-32 flex items-end justify-center overflow-hidden">
        {/* Scale */}
        <div className="absolute inset-0 flex justify-between items-end px-4 pb-2 border-b border-slate-800">
          {[-50, -25, 0, 25, 50].map(v => (
            <div key={v} className="flex flex-col items-center gap-1">
              <div className={`w-0.5 h-3 ${v === 0 ? 'bg-cyan-400 h-6' : 'bg-slate-700'}`}></div>
              <span className="text-[10px] font-mono text-slate-600">{v}</span>
            </div>
          ))}
        </div>

        {/* Needle */}
        <div 
          className={`absolute w-1 h-24 origin-bottom transition-transform duration-150 ease-out ${isTuned ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-rose-500'}`}
          style={{ 
            transform: `rotate(${noteInfo ? (noteInfo.cents / 50) * 45 : 0}deg)`,
            bottom: '8px'
          }}
        ></div>
        
        {/* Center Point */}
        <div className="absolute bottom-1 w-4 h-4 bg-slate-900 rounded-full border-2 border-slate-700 z-10"></div>
      </div>

      {/* Note Display */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <span className={`text-8xl font-black tracking-tighter transition-colors duration-300 ${isTuned ? 'text-emerald-400' : 'text-slate-100'}`}>
            {noteInfo?.note || '--'}
          </span>
          <span className="absolute -top-2 -right-6 text-3xl font-bold text-slate-500">
            {noteInfo?.octave}
          </span>
        </div>
        
        <div className="mt-4 flex flex-col items-center gap-1">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            {noteInfo ? `${noteInfo.frequency.toFixed(2)} Hz` : 'Waiting for signal...'}
          </span>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${isTuned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {noteInfo ? (noteInfo.cents > 0 ? `+${noteInfo.cents} Cents` : `${noteInfo.cents} Cents`) : 'In Tune'}
          </div>
        </div>
      </div>
    </div>
  )
}
