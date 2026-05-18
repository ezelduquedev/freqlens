import { useState } from 'react'
import { CalibrationService } from '../../core/audio/CalibrationService'
import { AdaptiveEQManager } from '../../core/audio/AdaptiveEQManager'
import { AudioManager } from '../../core/audio/AudioManager'
import { StorageManager, type CalibrationResult } from '../../core/db/StorageManager'
import { Activity, ShieldCheck, RefreshCw, Zap, Volume2, CheckCircle2, Play } from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel'
import { Button } from '../../ui/Button'
import { SectionTitle } from '../../ui/SectionTitle'

interface EQCalibrationProps {
  onNavigateToEQ?: () => void
}

type Step = 'selection' | 'measuring' | 'result'
type SignalType = 'sweep' | 'pink'

export const EQCalibration = ({ onNavigateToEQ }: EQCalibrationProps) => {
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
      if (onNavigateToEQ) {
        onNavigateToEQ()
      } else {
        setStep('selection')
      }
      setApplied(false)
    }, 1800)
  }

  return (
    <GlassPanel className="h-full flex flex-col gap-8 w-full select-none" hoverEffect>
      
      {/* 1. Technical Steps Progress Header */}
      <div className="flex items-center justify-between max-w-md mx-auto w-full select-none">
        
        {/* Step 1: Selection */}
        <div className={`flex flex-col items-center gap-2 ${step === 'selection' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs transition-all ${step === 'selection' ? 'border-accent bg-accent/10 text-accent shadow-[0_0_10px_var(--accent-glow)]' : 'border-white/10'}`}>1</div>
          <span className="mono text-[9px] font-bold uppercase tracking-widest">Selección</span>
        </div>
        
        <div className="flex-1 h-px bg-white/5 mx-4 mb-5"></div>
        
        {/* Step 2: Measuring */}
        <div className={`flex flex-col items-center gap-2 ${step === 'measuring' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs transition-all ${step === 'measuring' ? 'border-accent bg-accent/10 text-accent shadow-[0_0_10px_var(--accent-glow)]' : 'border-white/10'}`}>2</div>
          <span className="mono text-[9px] font-bold uppercase tracking-widest">Medición</span>
        </div>
        
        <div className="flex-1 h-px bg-white/5 mx-4 mb-5"></div>
        
        {/* Step 3: Results */}
        <div className={`flex flex-col items-center gap-2 ${step === 'result' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs transition-all ${step === 'result' ? 'border-accent bg-accent/10 text-accent shadow-[0_0_10px_var(--accent-glow)]' : 'border-white/10'}`}>3</div>
          <span className="mono text-[9px] font-bold uppercase tracking-widest">Resultados</span>
        </div>
      </div>
 
      {/* 2. Main content router */}
      <div className="flex-grow flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        
        {/* Step: Selection */}
        {step === 'selection' && (
          <div className="space-y-8 w-full fade-in">
            <div className="text-center">
              <SectionTitle
                title="Configuración de Calibración Acústica"
                subtitle="Selecciona la señal de excitación del impulso"
                icon={<Volume2 className="w-4 h-4 text-accent animate-pulse" />}
              />
              <p className="text-text-soft text-xs leading-relaxed max-w-md mx-auto -mt-3">
                Selecciona el método de excitación para medir la acústica de tu sala. Asegura silencio ambiental antes de comenzar.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Method: Sine sweep */}
              <button 
                onClick={() => setSignal('sweep')}
                className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between h-40 ${signal === 'sweep' ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'}`}
              >
                <div className="flex justify-between items-start w-full mb-3">
                  <div className="p-2 bg-accent/10 rounded-xl text-accent">
                    <Zap className="w-5 h-5" />
                  </div>
                  {signal === 'sweep' && <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />}
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-sm mb-1">Barrido Senoidal</h4>
                  <p className="text-[9px] text-text-soft font-mono leading-relaxed uppercase tracking-tighter">
                    Barrido logarítmico 20Hz-20kHz. Alta precisión para identificar resonancias de fase.
                  </p>
                </div>
              </button>
 
              {/* Method: Pink noise */}
              <button 
                onClick={() => setSignal('pink')}
                className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between h-40 ${signal === 'pink' ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'}`}
              >
                <div className="flex justify-between items-start w-full mb-3">
                  <div className="p-2 bg-accent/10 rounded-xl text-accent">
                    <Activity className="w-5 h-5" />
                  </div>
                  {signal === 'pink' && <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />}
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-sm mb-1">Ruido Rosa</h4>
                  <p className="text-[9px] text-text-soft font-mono leading-relaxed uppercase tracking-tighter">
                    Energía constante por octava. Respuesta más equilibrada similar a la audición humana.
                  </p>
                </div>
              </button>
            </div>
 
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full mt-4" 
              onClick={startCalibration}
              icon={<Play className="w-4 h-4" />}
            >
              Iniciar Calibración de Sala
            </Button>
          </div>
        )}
 
        {/* Step: Measuring progress */}
        {step === 'measuring' && (
          <div className="text-center space-y-8 w-full max-w-md fade-in flex flex-col items-center">
            {/* Round progress SVGs */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="58" 
                  stroke="#ff8c00" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={364} 
                  strokeDashoffset={364 - (364 * progress) / 100} 
                  className="transition-all duration-300 stroke-round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col select-none">
                <span className="text-2xl font-black text-white font-mono">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Capturando respuesta de sala...</h3>
              <p className="mono text-[10px] text-accent animate-pulse uppercase">Mantén absoluto silencio ambiental</p>
            </div>
          </div>
        )}
 
        {/* Step: Result summary */}
        {step === 'result' && (
          <div className="w-full space-y-6 fade-in">
            <div className="text-center">
              <SectionTitle
                title="Calibración Acústica Completada"
                subtitle="Curva de respuesta compensatoria calculada"
                icon={<CheckCircle2 className="w-4 h-4 text-success" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Table readout */}
              <div className="bg-[#05070a] border border-white/5 rounded-2xl p-4 max-h-[180px] overflow-y-auto no-scrollbar flex flex-col justify-between">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="text-[9px] uppercase tracking-widest text-text-muted font-bold border-b border-white/5">
                    <tr>
                      <th className="pb-2 font-semibold">Frecuencia (Hz)</th>
                      <th className="pb-2 text-right font-semibold">Corrección (dB)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correctionData.map((band, idx) => (
                      <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                        <td className="py-2 text-text-soft font-medium">
                          {band.freq < 1000 ? `${band.freq} Hz` : `${(band.freq/1000).toFixed(1)} kHz`}
                        </td>
                        <td className={`py-2 text-right font-bold ${band.gain > 0 ? 'text-accent' : band.gain < 0 ? 'text-blue-400' : 'text-text-muted'}`}>
                          {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)} dB
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dynamic SVG Visual Curve Representation of the EQ */}
              <div className="bg-[#05070a] border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden h-[180px]">
                <span className="mono text-[9px] uppercase tracking-widest text-text-muted font-bold block mb-2 text-center">Curva Correctiva Recomendada</span>
                <div className="w-full flex-grow relative bg-black/30 rounded-xl overflow-hidden border border-white/[0.02] flex items-center justify-center p-2">
                  <svg className="w-full h-full" viewBox="0 0 240 80" preserveAspectRatio="none">
                    {/* Grid horizontal lines */}
                    <line x1="0" y1="40" x2="240" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3" strokeWidth="1" />
                    
                    {/* Grid vertical lines */}
                    <line x1="40" y1="0" x2="40" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="80" y1="0" x2="80" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="120" y1="0" x2="120" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="160" y1="0" x2="160" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="200" y1="0" x2="200" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {/* Smooth Bezier Path */}
                    {(() => {
                      if (correctionData.length === 0) return null
                      const points = correctionData.map((band, idx) => {
                        const x = 20 + idx * 50
                        const y = 40 - (band.gain / 12) * 28 // normalized coordinates
                        return { x, y }
                      })

                      let path = `M 0 40 L ${points[0].x} ${points[0].y}`
                      for (let i = 0; i < points.length - 1; i++) {
                        const p0 = points[i]
                        const p1 = points[i+1]
                        const cpX1 = p0.x + 25
                        const cpY1 = p0.y
                        const cpX2 = p1.x - 25
                        const cpY2 = p1.y
                        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
                      }
                      path += ` L 240 40`

                      return (
                        <>
                          <path
                            d={`${path} L 240 80 L 0 80 Z`}
                            fill="url(#result-curve-grad)"
                            className="opacity-20"
                          />
                          <defs>
                            <linearGradient id="result-curve-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ff8c00" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                          <path
                            d={path}
                            fill="none"
                            stroke="#ff8c00"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          {points.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r="2.5"
                              fill="#ff8c00"
                              stroke="#05070a"
                              strokeWidth="1"
                            />
                          ))}
                        </>
                      )
                    })()}
                  </svg>
                </div>
              </div>
            </div>
 
            {/* Results action options */}
            {applied ? (
              <div className="py-4 bg-success/15 text-success border border-success/25 text-center font-bold text-xs uppercase tracking-widest rounded-xl animate-pulse font-mono flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                ¡Corrección Aplicada y Enrutada!
              </div>
            ) : (
              <div className="flex gap-4">
                <Button variant="secondary" size="md" className="flex-grow flex-shrink-0 w-1/3" onClick={() => setStep('selection')} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                  Repetir
                </Button>
                <Button 
                  variant="primary" 
                  size="md" 
                  className="flex-grow w-2/3" 
                  onClick={applyCorrection} 
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                >
                  Aplicar y Ver Ecualizador
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
 
    </GlassPanel>
  )
}