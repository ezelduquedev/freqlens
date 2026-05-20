import { useState, useEffect } from 'react';
import { AudioManager } from '../../core/audio/AudioManager';
import { PitchService, type NoteInfo } from '../../core/dsp/PitchService';
import { GlassPanel } from '../../ui/GlassPanel';
import { Music } from 'lucide-react';

export const MiniTuner = () => {
  const [noteInfo, setNoteInfo] = useState<NoteInfo | null>(null);

  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    
    // Register listener for real-time fundamental frequency (pitch)
    audioManager.setOnPitchListener((pitch) => {
      if (pitch && pitch > 0) {
        const info = PitchService.getNoteFromFrequency(pitch);
        setNoteInfo(info);
      } else {
        setNoteInfo(null);
      }
    });

    return () => {
      audioManager.setOnPitchListener(() => {});
    };
  }, []);

  const isTuned = noteInfo && Math.abs(noteInfo.cents) < 5;
  const isOnline = !!AudioManager.getInstance().getContext() && AudioManager.getInstance().getContext()?.state === 'running';

  return (
    <GlassPanel className="flex flex-col gap-2 !p-2 flex-shrink-0 select-none" hoverEffect>
      {/* Header Info */}
      <div className="flex justify-between items-center font-mono">
        <h4 className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1">
          <Music className="w-3.5 h-3.5 text-accent animate-pulse" />
          Afinador Cromático
        </h4>
        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${isOnline ? 'bg-success/5 text-success border-success/15' : 'bg-white/5 text-text-muted border-white/5'}`}>
          {isOnline ? 'DSP ACTIVO' : 'SIN SEÑAL'}
        </span>
      </div>

      {/* Main Display Grid */}
      <div className="flex items-center justify-between bg-black/45 border border-white/5 rounded-2xl p-2.5 h-[62px]">
        {/* Left Side: Dynamic Note & Octave */}
        <div className="flex items-baseline gap-0.5">
          <span className={`font-mono text-4xl font-black leading-none transition-colors duration-200 ${isTuned ? 'text-success drop-shadow-[0_0_10px_rgba(48,209,88,0.3)]' : noteInfo ? 'text-white' : 'text-text-muted'}`}>
            {noteInfo ? noteInfo.note : '--'}
          </span>
          <span className="font-mono text-xs font-black text-text-soft">
            {noteInfo ? noteInfo.octave : ''}
          </span>
        </div>

        {/* Center: Frequency Readout */}
        <div className="text-center font-mono flex flex-col justify-center">
          <span className="text-[10px] font-extrabold text-white leading-none">
            {noteInfo ? `${noteInfo.frequency.toFixed(1)} Hz` : 'Esperando...'}
          </span>
          <span className="text-[6.5px] text-text-muted uppercase tracking-widest font-black mt-1">
            Algoritmo YIN
          </span>
        </div>

        {/* Right Side: Deviation Cents Tag */}
        <div className="text-right">
          <span className={`inline-block font-mono text-[9px] font-extrabold uppercase px-2 py-1 rounded-lg border transition-all duration-200 ${isTuned ? 'bg-success/10 text-success border-success/20' : noteInfo ? 'bg-accent/10 text-accent border-accent/20' : 'bg-white/[0.02] text-text-muted border-white/5'}`}>
            {noteInfo ? (noteInfo.cents > 0 ? `+${Math.round(noteInfo.cents)} c` : `${Math.round(noteInfo.cents)} c`) : 'Afinado'}
          </span>
        </div>
      </div>

      {/* Cents horizontal LED indicator bar */}
      <div className="flex flex-col gap-1 w-full select-none font-mono">
        <div className="relative w-full h-1.5 bg-black/35 rounded-full overflow-hidden border border-white/5">
          {/* Centered zero tick mark */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/10 z-10" />

          {/* Ledger Notch */}
          {noteInfo && (
            <div
              className={`absolute top-0 bottom-0 w-2.5 -ml-1.25 rounded-full transition-all duration-100 ease-out z-20 ${isTuned ? 'bg-success shadow-[0_0_8px_rgba(48,209,88,0.8)]' : 'bg-accent shadow-[0_0_6px_var(--accent-glow)]'}`}
              style={{
                left: `${50 + (noteInfo.cents / 50) * 50}%` // Maps -50..50 to 0%..100%
              }}
            />
          )}
        </div>
        
        {/* Scale labels */}
        <div className="flex justify-between text-[6.5px] text-text-muted font-bold px-1 select-none">
          <span>-50 c</span>
          <span className={isTuned ? 'text-success font-black' : 'text-text-muted'}>0</span>
          <span>+50 c</span>
        </div>
      </div>
    </GlassPanel>
  );
};
