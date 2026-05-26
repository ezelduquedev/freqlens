import { useState } from 'react'
import { CalibrationService } from '../../core/audio/CalibrationService'
import { AdaptiveEQManager } from '../../core/audio/AdaptiveEQManager'
import { AudioManager } from '../../core/audio/AudioManager'
import { RoomAnalysisEngine, type RoomAnalysisResult } from '../../core/audio/RoomAnalysisEngine'
import { EQRecommendationEngine, type SuggestedBand } from '../../core/audio/EQRecommendationEngine'
import { RoomProfileStorage } from '../../core/audio/RoomProfileStorage'
import { Activity, ShieldCheck, RefreshCw, Zap, Volume2, CheckCircle2, AlertCircle } from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel'

interface EQCalibrationProps {
  onNavigateToEQ?: () => void
}

type Step = 'selection' | 'measuring' | 'result'
type SignalType = 'sweep' | 'pink'

export const EQCalibration = ({ onNavigateToEQ }: EQCalibrationProps) => {
  const [step, setStep] = useState<Step>('selection')
  const [signal, setSignal] = useState<SignalType>('sweep')
  const [progress, setProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<RoomAnalysisResult | null>(null)
  const [recommendations, setRecommendations] = useState<SuggestedBand[]>([])
  const [roomName, setRoomName] = useState('')
  const [roomNotes, setRoomNotes] = useState('')
  const [applied, setApplied] = useState(false)
  const calibrationService = CalibrationService.getInstance()
  const eqManager = AdaptiveEQManager.getInstance()

  const startCalibration = async () => {
    setStep('measuring')
    setProgress(0)
    setApplied(false)
    setAnalysisResult(null)
    setRecommendations([])
    const duration = signal === 'sweep' ? 10 : 15
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const p = Math.min(100, (elapsed / duration) * 100)
      setProgress(p)
      if (p >= 100) clearInterval(progressInterval)
    }, 200)
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
      const analysis = RoomAnalysisEngine.analyze(Array.from(response), frequencies)
      setAnalysisResult(analysis)
      const suggestions = EQRecommendationEngine.calculate(Array.from(response), frequencies)
      setRecommendations(suggestions)
      const today = new Date().toLocaleDateString()
      setRoomName(`Sala Calibrada (${today})`)
      setRoomNotes('')
      setStep('result')
    } catch (err) {
      console.error('Calibration failed', err)
      setStep('selection')
    }
  }

  const handleApplyAndSave = () => {
    if (!analysisResult) return
    recommendations.forEach(rec => {
      eqManager.setBandGain(rec.id, rec.suggestedGain)
    })
    const eqValues: Record<string, number> = {}
    recommendations.forEach(rec => {
      eqValues[rec.id] = rec.suggestedGain
    })
    RoomProfileStorage.saveProfile({
      id: `room-${Date.now()}`,
      name: roomName || 'Mi Sala',
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      averageRMS: analysisResult.averageRMS,
      acousticRating: analysisResult.acousticRating,
      issues: analysisResult.issues,
      eqValues: eqValues,
      notes: roomNotes || 'Sin observaciones.'
    })
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
    <GlassPanel className="h-full flex flex-col gap-4 w-full select-none border-white/5 bg-black/10 !p-5" hoverEffect>
      {/* Steps Progress Header - más compacto */}
      <div className="flex items-center justify-between max-w-md mx-auto w-full select-none flex-shrink-0 font-mono">
        <div className={`flex flex-col items-center gap-1 ${step === 'selection' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-[9px] transition-all ${
            step === 'selection' ? 'border-accent bg-accent/10 text-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]' : 'border-white/10 text-text-muted bg-black/20'
          }`}>1</div>
          <span className="text-[7px] font-black uppercase tracking-widest">SELECCIÓN</span>
        </div>
        <div className="flex-grow h-0.5 bg-white/5 mx-3 mb-4" />
        <div className={`flex flex-col items-center gap-1 ${step === 'measuring' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-[9px] transition-all ${
            step === 'measuring' ? 'border-accent bg-accent/10 text-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]' : 'border-white/10 text-text-muted bg-black/20'
          }`}>2</div>
          <span className="text-[7px] font-black uppercase tracking-widest">MEDICIÓN</span>
        </div>
        <div className="flex-grow h-0.5 bg-white/5 mx-3 mb-4" />
        <div className={`flex flex-col items-center gap-1 ${step === 'result' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-[9px] transition-all ${
            step === 'result' ? 'border-accent bg-accent/10 text-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]' : 'border-white/10 text-text-muted bg-black/20'
          }`}>3</div>
          <span className="text-[7px] font-black uppercase tracking-widest">RESULTADOS</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow flex flex-col items-center justify-center max-w-3xl mx-auto w-full min-h-0">
        
        {/* Step: Selection */}
        {step === 'selection' && (
          <div className="space-y-4 w-full fade-in font-mono">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Volume2 className="w-4 h-4 text-accent animate-pulse" />
                <h4 className="text-[12px] font-black text-white uppercase tracking-wider">CALIBRADOR ACÚSTICO INTELIGENTE</h4>
              </div>
              <span className="text-[8px] text-accent uppercase tracking-widest block font-extrabold mb-2">ELIGE LA SEÑAL DE PRUEBA</span>
              <p className="text-text-soft text-[9px] leading-relaxed max-w-sm mx-auto">
                Mide las resonancias acústicas físicas de tu espacio y genera perfiles correctivos limitados a ±6 dB.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => setSignal('sweep')} className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between h-28 bg-white dark:bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${
                signal === 'sweep' ? 'border-accent/40 bg-accent/[0.01] shadow-[0_8px_30px_rgba(255,140,0,0.08)]' : 'border-black/5 dark:border-white/5 hover:border-accent/20'
              }`}>
                <div className="flex justify-between items-start w-full mb-1">
                  <div className="p-1.5 bg-accent/10 rounded-lg text-accent"><Zap className="w-4 h-4" /></div>
                  {signal === 'sweep' && <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]" />}
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-[10px] mb-0.5">Barrido Senoidal</h4>
                  <p className="text-[7px] text-text-soft font-bold leading-relaxed uppercase tracking-wide">20Hz-20kHz logarítmico. Alta precisión para resonancias modales.</p>
                </div>
              </button>
              <button onClick={() => setSignal('pink')} className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between h-28 bg-white dark:bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${
                signal === 'pink' ? 'border-accent/40 bg-accent/[0.01] shadow-[0_8px_30px_rgba(255,140,0,0.08)]' : 'border-black/5 dark:border-white/5 hover:border-accent/20'
              }`}>
                <div className="flex justify-between items-start w-full mb-1">
                  <div className="p-1.5 bg-accent/10 rounded-lg text-accent"><Activity className="w-4 h-4" /></div>
                  {signal === 'pink' && <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]" />}
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-[10px] mb-0.5">Ruido Rosa</h4>
                  <p className="text-[7px] text-text-soft font-bold leading-relaxed uppercase tracking-wide">Energía equilibrada por octava. Balance tonal psicoacústico.</p>
                </div>
              </button>
            </div>
            <button className="w-full bg-accent hover:bg-accent/90 text-black font-extrabold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-[10px] cursor-pointer shadow-[0_0_12px_rgba(255,140,0,0.2)]" onClick={startCalibration}>
              <span>▶</span> INICIAR CALIBRACIÓN
            </button>
          </div>
        )}

        {/* Step: Measuring */}
        {step === 'measuring' && (
          <div className="text-center space-y-4 w-full max-w-sm fade-in flex flex-col items-center font-mono">
            <div className="relative w-24 h-24 select-none">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="44" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
                <circle cx="48" cy="48" r="44" stroke="#ff8c00" strokeWidth="4" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} className="transition-all duration-300 stroke-round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-lg font-black text-white">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Capturando impulsos...</h3>
              <p className="text-[8px] text-accent animate-pulse uppercase tracking-widest font-bold">Mantén silencio en la sala</p>
            </div>
          </div>
        )}

        {/* Step: Result - SIN SCROLL, todo compacto */}
        {step === 'result' && analysisResult && (
          <div className="w-full space-y-3 fade-in font-mono">
            {/* Header compacto */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-success animate-pulse" />
                <h4 className="text-[11px] font-black text-white uppercase tracking-wider">DIAGNÓSTICO COMPLETADO</h4>
              </div>
              <span className="text-[8px] text-accent uppercase tracking-widest block font-extrabold">ANÁLISIS DE RESPUESTA FÍSICA DE TU SALA</span>
            </div>

            {/* Row 1: Rating + Form - más bajos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-[#05070a] border border-white/5 rounded-2xl p-2.5 flex flex-col justify-between items-center text-center font-mono h-[100px]">
                <span className="text-[7px] text-text-soft uppercase tracking-widest font-black">RATING</span>
                <span className={`text-xl font-black uppercase my-0.5 tracking-widest ${
                  analysisResult.acousticRating === 'Excelente' ? 'text-success' :
                  analysisResult.acousticRating === 'Buena' ? 'text-yellow-500' :
                  analysisResult.acousticRating === 'Tratable' ? 'text-orange-500' : 'text-danger'
                }`}>{analysisResult.acousticRating}</span>
                <span className="text-[7px] text-text-muted leading-tight uppercase font-bold tracking-tight">RMS: <strong className="text-white">{analysisResult.averageRMS.toFixed(1)} DB</strong></span>
              </div>
              <div className="md:col-span-2 bg-[#05070a] border border-white/5 rounded-2xl p-2.5 flex flex-col gap-1.5 h-[100px]">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] uppercase tracking-widest text-text-soft font-black">NOMBRE DEL PERFIL</label>
                  <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Ej. Mi Estudio..." className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1 font-mono text-[9px] text-white focus:outline-none focus:border-accent" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] uppercase tracking-widest text-text-soft font-black">OBSERVACIONES</label>
                  <input type="text" value={roomNotes} onChange={(e) => setRoomNotes(e.target.value)} placeholder="Ej. Cerca de pared..." className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1 font-mono text-[9px] text-white focus:outline-none focus:border-accent" />
                </div>
              </div>
            </div>

            {/* Row 2: Issues + Recommendations - lado a lado, más compacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Issues - más compacto */}
              <div className="bg-[#05070a] border border-white/5 rounded-2xl p-2.5 flex flex-col gap-1.5">
                <span className="text-[7px] uppercase tracking-widest text-text-soft font-black block mb-0.5">PROBLEMAS DETECTADOS</span>
                <div className="flex flex-col gap-1.5">
                  {analysisResult.issues.map((issue, idx) => (
                    <div key={idx} className="flex gap-1.5 items-start bg-white/[0.01] border border-white/[0.02] p-1.5 rounded-xl">
                      {issue.type === 'resonance' ? <AlertCircle className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" /> : <Activity className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />}
                      <div className="min-w-0 flex-grow font-mono">
                        <h6 className="text-[8px] font-black text-white leading-tight uppercase tracking-wide">{issue.message}</h6>
                        <p className="text-[7px] text-text-muted leading-tight mt-0.5 uppercase tracking-wide font-bold">{issue.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations - más compacto */}
              <div className="bg-[#05070a] border border-white/5 rounded-2xl p-2.5 flex flex-col gap-1.5">
                <span className="text-[7px] uppercase tracking-widest text-text-soft font-black block mb-0.5">RECOMENDACIÓN EQ (±6 DB)</span>
                <div className="flex flex-col gap-1">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/[0.02] p-1 px-1.5 rounded-xl font-mono text-[7.5px]">
                      <div className="flex items-center gap-1">
                        <span className="text-text-soft font-bold uppercase truncate max-w-[50px]">{rec.id.replace('-shelf', '')}</span>
                        <span className="text-[6px] text-text-muted font-bold">({rec.frequency}HZ)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[6.5px] text-text-muted font-bold max-w-[100px] truncate uppercase">{rec.reason.split(' para ')[0]}</span>
                        <span className={`font-black text-[7px] text-right min-w-[40px] px-1 py-0.5 rounded-full border uppercase ${
                          rec.suggestedGain > 0 ? 'text-accent bg-accent/5 border-accent/15' :
                          rec.suggestedGain < 0 ? 'text-blue-400 bg-blue-500/5 border-blue-400/15' :
                          'text-text-muted'
                        }`}>{rec.suggestedGain > 0 ? '+' : ''}{rec.suggestedGain.toFixed(1)} DB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            {applied ? (
              <div className="py-2.5 bg-success/15 text-success border border-success/25 text-center font-bold text-[10px] uppercase tracking-widest rounded-xl animate-pulse font-mono flex items-center justify-center gap-2 select-none">
                <CheckCircle2 className="w-3.5 h-3.5" />¡CURVA APLICADA Y GUARDADA!
              </div>
            ) : (
              <div className="flex gap-2">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-extrabold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider text-[8px] border border-white/10 cursor-pointer" onClick={() => setStep('selection')}>
                  <RefreshCw className="w-3 h-3" /> Repetir
                </button>
                <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-extrabold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider text-[8px] cursor-pointer" onClick={onNavigateToEQ}>
                  <span>← EQ</span>
                </button>
                <button className="flex-1 bg-white hover:bg-white/90 text-black font-extrabold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider text-[8px] cursor-pointer shadow-[0_0_12px_rgba(255,140,0,0.2)]" onClick={handleApplyAndSave}>
                  <ShieldCheck className="w-3 h-3" /> Aplicar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  )
}