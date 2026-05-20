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
  
  // Motores de análisis acústico
  const [analysisResult, setAnalysisResult] = useState<RoomAnalysisResult | null>(null)
  const [recommendations, setRecommendations] = useState<SuggestedBand[]>([])
  
  // Datos del perfil
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
      
      // 1. Ejecutar el análisis acústico inteligente
      const analysis = RoomAnalysisEngine.analyze(Array.from(response), frequencies)
      setAnalysisResult(analysis)
      
      // 2. Calcular la curva correctiva recomendada de ecualización (límite ±6dB)
      const suggestions = EQRecommendationEngine.calculate(Array.from(response), frequencies)
      setRecommendations(suggestions)
      
      // Inicializar el nombre por defecto de la sala
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

    // 1. Aplicar la EQ correctiva a los filtros DSP
    recommendations.forEach(rec => {
      eqManager.setBandGain(rec.id, rec.suggestedGain)
    });
    
    // 2. Guardar en el almacenamiento de perfiles de sala
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
    <GlassPanel className="h-full flex flex-col gap-6 w-full select-none border-white/5 bg-black/10 !p-6" hoverEffect>
      
      {/* 1. Technical Steps Progress Header exactly matching mockup */}
      <div className="flex items-center justify-between max-w-lg mx-auto w-full select-none flex-shrink-0 font-mono">
        {/* Step 1: Selection */}
        <div className={`flex flex-col items-center gap-1.5 ${step === 'selection' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-[10px] transition-all ${
            step === 'selection' 
              ? 'border-accent bg-accent/10 text-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]' 
              : 'border-white/10 text-text-muted bg-black/20'
          }`}>
            1
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">SELECCIÓN</span>
        </div>
        
        <div className="flex-grow h-0.5 bg-white/5 mx-4 mb-5" />
        
        {/* Step 2: Measuring */}
        <div className={`flex flex-col items-center gap-1.5 ${step === 'measuring' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-[10px] transition-all ${
            step === 'measuring' 
              ? 'border-accent bg-accent/10 text-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]' 
              : 'border-white/10 text-text-muted bg-black/20'
          }`}>
            2
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">MEDICIÓN</span>
        </div>
        
        <div className="flex-grow h-0.5 bg-white/5 mx-4 mb-5" />
        
        {/* Step 3: Results */}
        <div className={`flex flex-col items-center gap-1.5 ${step === 'result' ? 'text-accent' : 'text-text-muted'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-[10px] transition-all ${
            step === 'result' 
              ? 'border-accent bg-accent/10 text-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]' 
              : 'border-white/10 text-text-muted bg-black/20'
          }`}>
            3
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">RESULTADOS</span>
        </div>
      </div>
 
      {/* 2. Main content router */}
      <div className="flex-grow flex flex-col items-center justify-center max-w-2xl mx-auto w-full min-h-0">
        
        {/* Step: Selection (mockup 4) */}
        {step === 'selection' && (
          <div className="space-y-6 w-full fade-in font-mono">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Volume2 className="w-5 h-5 text-accent animate-pulse" />
                <h4 className="text-[13px] font-black text-white uppercase tracking-wider">
                  CALIBRADOR ACÚSTICO INTELIGENTE
                </h4>
              </div>
              <span className="text-[9px] text-accent uppercase tracking-widest block font-extrabold mb-4">
                ELIGE LA SEÑAL DE PRUEBA PARA EL ANÁLISIS DE SALA
              </span>
              <p className="text-text-soft text-[10px] leading-relaxed max-w-md mx-auto">
                Mide las resonancias acústicas físicas de tu espacio y genera perfiles correctivos Sonarworks-style limitados a ±6 dB.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Method: Sine sweep */}
              <button 
                onClick={() => setSignal('sweep')}
                className={`p-5 rounded-3xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between h-36 bg-white dark:bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${
                  signal === 'sweep' 
                    ? 'border-accent/40 bg-accent/[0.01] shadow-[0_8px_30px_rgba(255,140,0,0.08)]' 
                    : 'border-black/5 dark:border-white/5 hover:border-accent/20'
                }`}
              >
                <div className="flex justify-between items-start w-full mb-2">
                  <div className="p-2 bg-accent/10 rounded-xl text-accent">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                  {signal === 'sweep' && <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]" />}
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-[10.5px] mb-1">Barrido Senoidal (Círculo Acústico)</h4>
                  <p className="text-[7.5px] text-text-soft font-bold leading-relaxed uppercase tracking-wide">
                    Barrido logarítmico 20Hz-20kHz. Alta precisión matemática para resonancias modales graves.
                  </p>
                </div>
              </button>
 
              {/* Method: Pink noise */}
              <button 
                onClick={() => setSignal('pink')}
                className={`p-5 rounded-3xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between h-36 bg-white dark:bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${
                  signal === 'pink' 
                    ? 'border-accent/40 bg-accent/[0.01] shadow-[0_8px_30px_rgba(255,140,0,0.08)]' 
                    : 'border-black/5 dark:border-white/5 hover:border-accent/20'
                }`}
              >
                <div className="flex justify-between items-start w-full mb-2">
                  <div className="p-2 bg-accent/10 rounded-xl text-accent">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  {signal === 'pink' && <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,140,0,0.8)]" />}
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-[10.5px] mb-1">Ruido Rosa Constante</h4>
                  <p className="text-[7.5px] text-text-soft font-bold leading-relaxed uppercase tracking-wide">
                    Energía equilibrada por octava. Perfecto para analizar el balance tonal psicoacústico real.
                  </p>
                </div>
              </button>
            </div>
 
            <button 
              className="w-full bg-accent hover:bg-accent/90 text-black font-extrabold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-[10.5px] cursor-pointer shadow-[0_0_12px_rgba(255,140,0,0.2)] mt-2"
              onClick={startCalibration}
            >
              <span>▶</span> INICIAR CALIBRACIÓN DE SALA
            </button>
          </div>
        )}
  
        {/* Step: Measuring progress */}
        {step === 'measuring' && (
          <div className="text-center space-y-6 w-full max-w-md fade-in flex flex-col items-center font-mono">
            {/* Round progress SVGs */}
            <div className="relative w-28 h-28 select-none">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="50" stroke="rgba(255,255,255,0.03)" strokeWidth="5" fill="transparent" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="50" 
                  stroke="#ff8c00" 
                  strokeWidth="5" 
                  fill="transparent" 
                  strokeDasharray={314} 
                  strokeDashoffset={314 - (314 * progress) / 100} 
                  className="transition-all duration-300 stroke-round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-black text-white">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Capturando impulsos y reverberación...</h3>
              <p className="text-[8.5px] text-accent animate-pulse uppercase tracking-widest font-bold">Mantén absoluto silencio en la sala</p>
            </div>
          </div>
        )}
  
        {/* Step: Result summary and inputs (mockup 3) */}
        {step === 'result' && analysisResult && (
          <div className="w-full space-y-4 fade-in overflow-y-auto no-scrollbar max-h-[calc(100vh-230px)] pr-1 font-mono">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <CheckCircle2 className="w-5 h-5 text-success animate-pulse" />
                <h4 className="text-[13px] font-black text-white uppercase tracking-wider">
                  DIAGNÓSTICO ACÚSTICO COMPLETADO
                </h4>
              </div>
              <span className="text-[9px] text-accent uppercase tracking-widest block font-extrabold">
                EL SISTEMA INTELIGENTE HA ANALIZADO LA RESPUESTA FÍSICA DE TU SALA
              </span>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Rating Card */}
              <div className="bg-[#05070a] border border-white/5 rounded-3xl p-3 flex flex-col justify-between items-center text-center font-mono h-[135px]">
                <span className="text-[7.5px] text-text-soft uppercase tracking-widest font-black">RATING DE LA SALA</span>
                
                {/* Monospace huge colored rating name exactly like mockup */}
                <span className={`text-2xl font-black uppercase my-1.5 tracking-widest ${
                  analysisResult.acousticRating === 'Excelente' ? 'text-success' :
                  analysisResult.acousticRating === 'Buena' ? 'text-yellow-500' :
                  analysisResult.acousticRating === 'Tratable' ? 'text-orange-500' : 'text-danger'
                }`}>
                  {analysisResult.acousticRating}
                </span>
                
                <span className="text-[7.5px] text-text-muted leading-tight uppercase font-bold tracking-tight">
                  DESVIACIÓN PROMEDIO: <strong className="text-white">{analysisResult.averageRMS.toFixed(1)} DB</strong>
                </span>
              </div>
 
              {/* Form Input Card */}
              <div className="md:col-span-2 bg-[#05070a] border border-white/5 rounded-3xl p-3 flex flex-col gap-2.5 h-[135px]">
                <div className="flex flex-col gap-1">
                  <label className="text-[7.5px] uppercase tracking-widest text-text-soft font-black block">
                    NOMBRE DEL PERFIL DE SALA
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Ej. Mi Estudio, Dormitorio Mezcla..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-1.5 font-mono text-[10px] text-white focus:outline-none focus:border-accent"
                  />
                </div>
 
                <div className="flex flex-col gap-1">
                  <label className="text-[7.5px] uppercase tracking-widest text-text-soft font-black block">
                    OBSERVACIONES / NOTAS
                  </label>
                  <input
                    type="text"
                    value={roomNotes}
                    onChange={(e) => setRoomNotes(e.target.value)}
                    placeholder="Ej. Cerca de pared, cortinas cerradas..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-1.5 font-mono text-[10px] text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
 
            {/* Detailed Diagnostics: Issues warning tags & visual recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* List of Detected Issues */}
              <div className="bg-[#05070a] border border-white/5 rounded-3xl p-3.5 flex flex-col gap-2 min-h-[140px] max-h-[160px] overflow-y-auto no-scrollbar">
                <span className="text-[7.5px] uppercase tracking-widest text-text-soft font-black block mb-1">
                  PROBLEMAS ESPECTRALES IDENTIFICADOS
                </span>
                
                <div className="flex flex-col gap-2">
                  {analysisResult.issues.map((issue, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-white/[0.01] border border-white/[0.02] p-2 rounded-2xl">
                      {issue.type === 'resonance' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                      )}
                      
                      <div className="min-w-0 flex-grow font-mono">
                        <h6 className="text-[8.5px] font-black text-white leading-tight uppercase tracking-wide">
                          {issue.message}
                        </h6>
                        <p className="text-[7.5px] text-text-muted leading-tight mt-0.5 uppercase tracking-wide font-bold">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Suggested EQ correction curve */}
              <div className="bg-[#05070a] border border-white/5 rounded-3xl p-3.5 flex flex-col gap-2 min-h-[140px] max-h-[160px] overflow-y-auto no-scrollbar">
                <span className="text-[7.5px] uppercase tracking-widest text-text-soft font-black block mb-1">
                  RECOMENDACIÓN CORRECTIVA PARAMÉTRICA (±6 DB)
                </span>
                
                <div className="flex flex-col gap-1.5">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/[0.02] p-1 px-2 rounded-2xl font-mono text-[8px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-soft font-bold uppercase truncate max-w-[60px]">{rec.id.replace('-shelf', '')}</span>
                        <span className="text-[7px] text-text-muted font-bold">({rec.frequency} HZ)</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[7.5px] text-text-muted font-bold max-w-[150px] truncate uppercase">{rec.reason.split(' para ')[0]}</span>
                        <span className={`font-black text-[7.5px] text-right min-w-[45px] px-1.5 py-0.5 rounded-full border uppercase ${
                          rec.suggestedGain > 0 ? 'text-accent bg-accent/5 border-accent/15' :
                          rec.suggestedGain < 0 ? 'text-blue-400 bg-blue-500/5 border-blue-400/15' :
                          'text-text-muted'
                        }`}>
                          {rec.suggestedGain > 0 ? '+' : ''}{rec.suggestedGain.toFixed(1)} DB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
 
            {/* Results action options */}
            {applied ? (
              <div className="py-3.5 bg-success/15 text-success border border-success/25 text-center font-bold text-xs uppercase tracking-widest rounded-xl animate-pulse font-mono flex items-center justify-center gap-2 select-none">
                <CheckCircle2 className="w-4 h-4" />
                ¡CURVA APLICADA Y PERFIL PERSISTIDO!
              </div>
            ) : (
              <div className="flex gap-4">
                <button 
                  className="w-1/3 bg-white/5 hover:bg-white/10 text-white font-extrabold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider text-[9.5px] border border-white/10 cursor-pointer"
                  onClick={() => setStep('selection')} 
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Repetir Medición
                </button>
                <button 
                  className="w-2/3 bg-accent hover:bg-accent/90 text-black font-extrabold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider text-[9.5px] cursor-pointer shadow-[0_0_12px_rgba(255,140,0,0.2)]"
                  onClick={handleApplyAndSave} 
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> APLICAR CURVA Y GUARDAR SALA
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  )
}