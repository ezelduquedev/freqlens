import { useState } from 'react'
import { CalibrationService } from '../../core/audio/CalibrationService'
import { AdaptiveEQManager } from '../../core/audio/AdaptiveEQManager'
import { AudioManager } from '../../core/audio/AudioManager'
import { StorageManager, type CalibrationResult } from '../../core/db/StorageManager'

type Step = 'selection' | 'measuring' | 'result'
type SignalType = 'sweep' | 'pink'

export const EQCalibration = () => {
  const [step, setStep] = useState<Step>('selection')
  const [signal, setSignal] = useState<SignalType>('sweep')
  const [progress, setProgress] = useState(0)
  const [correctionData, setCorrectionData] = useState<{freq: number, gain: number}[]>([])
  const [applied, setApplied] = useState(false)
  
  const calibrationService = CalibrationService.getInstance()
  const eqManager = AdaptiveEQManager.getInstance()

  const startCalibration = async () => {
    setStep('measuring')
    setProgress(0)
    setApplied(false)
    
    const duration = signal === 'sweep' ? 10 : 15
    const startTime = Date.now()
    
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const p = Math.min(100, (elapsed / duration) * 100)
      setProgress(p)
      if (p >= 100) clearInterval(progressInterval)
    }, 100)

    try {
      const response = signal === 'sweep' 
        ? await calibrationService.runSineSweep(duration)
        : await calibrationService.runPinkNoise(duration)
      
      clearInterval(progressInterval)
      
      const ctx = AudioManager.getInstance().getContext()
      if (!ctx) return
      
      const nyquist = ctx.sampleRate / 2
      const binCount = response.length
      const frequencies = Array.from({ length: binCount }, (_, i) => (i * nyquist) / binCount)
      
      eqManager.calculateCorrection(Array.from(response), frequencies)
      
      const bands = eqManager.getBands()
      setCorrectionData(bands.map(b => ({ freq: b.frequency, gain: b.gain })))

      try {
        const storage = new StorageManager()
        await storage.init()
        const result: CalibrationResult = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          deviceName: 'Micrófono del dispositivo',
          frequencyResponse: Array.from(response)
        }
        await storage.saveCalibration(result)
      } catch (dbErr) {
        console.error('Failed to save calibration to DB', dbErr)
      }

      setStep('result')
    } catch (err) {
      console.error('Calibration failed', err)
      setStep('selection')
    }
  }

  const applyCorrection = () => {
    setApplied(true)
    setTimeout(() => {
      setStep('selection')
      setApplied(false)
    }, 2000)
  }

  return (
    <div className="h-full flex flex-col gap-8 p-8 bg-slate-900/20 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between max-w-md mx-auto w-full">
        <div className={`flex flex-col items-center gap-2 ${step === 'selection' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${step === 'selection' ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700'}`}>1</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Señal</span>
        </div>
        <div className="flex-1 h-[2px] bg-slate-800 mx-4 mb-6"></div>
        <div className={`flex flex-col items-center gap-2 ${step === 'measuring' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${step === 'measuring' ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700'}`}>2</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Medición</span>
        </div>
        <div className="flex-1 h-[2px] bg-slate-800 mx-4 mb-6"></div>
        <div className={`flex flex-col items-center gap-2 ${step === 'result' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${step === 'result' ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700'}`}>3</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Resultado</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        {step === 'selection' && (
          <div className="space-y-8 w-full">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Configuración de Calibración</h3>
              <p className="text-slate-400 text-sm">Selecciona el método de excitación para medir la acústica de tu sala.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setSignal('sweep')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${signal === 'sweep' ? 'border-cyan-400 bg-cyan-400/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-cyan-400/10 rounded-lg text-cyan-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  {signal === 'sweep' && <div className="w-3 h-3 rounded-full bg-cyan-400"></div>}
                </div>
                <h4 className="text-white font-bold mb-1">Sine Sweep</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tighter">Barrido logarítmico 20Hz-20kHz. Alta precisión, ideal para identificar resonancias puntuales.</p>
              </button>

              <button 
                onClick={() => setSignal('pink')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${signal === 'pink' ? 'border-cyan-400 bg-cyan-400/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-400/10 rounded-lg text-indigo-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                  {signal === 'pink' && <div className="w-3 h-3 rounded-full bg-cyan-400"></div>}
                </div>
                <h4 className="text-white font-bold mb-1">Ruido Rosa</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tighter">Energía constante por octava. Respuesta más equilibrada, similar a la audición humana.</p>
              </button>
            </div>

            <button 
              onClick={startCalibration}
              className="w-full py-4 bg-cyan-400 text-slate-950 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-400/20"
            >
              INICIAR CALIBRACIÓN
            </button>
          </div>
        )}

        {step === 'measuring' && (
          <div className="text-center space-y-8 w-full max-w-md">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * progress) / 100} className="text-cyan-400 transition-all duration-300 stroke-round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-black text-white">{Math.round(progress)}%</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Capturando respuesta...</h3>
          </div>
        )}

        {step === 'result' && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">Calibración Completada</h3>
            </div>
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 max-h-[30vh] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Banda (Hz)</th>
                    <th className="pb-2 text-right">Corrección Aplicada (dB)</th>
                  </tr>
                </thead>
                <tbody>
                  {correctionData.map((band, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 last:border-0">
                      <td className="py-2 text-slate-300 font-mono">{band.freq < 1000 ? band.freq : (band.freq/1000).toFixed(1) + 'k'}</td>
                      <td className="py-2 text-right font-mono font-bold text-cyan-400">
                        {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {applied ? (
              <div className="py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-center font-bold rounded-xl animate-pulse">
                ¡Corrección Aplicada con Éxito!
              </div>
            ) : (
              <div className="flex gap-4">
                  <button onClick={() => setStep('selection')} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl border border-slate-700">REPETIR</button>
                  <button onClick={applyCorrection} className="flex-1 py-3 bg-cyan-500 text-slate-950 font-black rounded-xl hover:bg-cyan-400">APLICAR CORRECCIÓN</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}