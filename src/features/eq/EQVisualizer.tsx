/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react'
import { AdaptiveEQManager, type EQBand } from '../../core/audio/AdaptiveEQManager'
import { FileDown } from 'lucide-react'
import { downloadRoomReport } from '../calibrate/RoomReportGenerator'
import { GlassPanel } from '../../ui/GlassPanel'
import { RoomProfileStorage, type RoomProfile } from '../../core/audio/RoomProfileStorage'

const freqToX = (freq: number, width: number, padding: number) => {
  const min = Math.log10(20)
  const max = Math.log10(20000)
  const log = Math.log10(freq)
  return padding + ((log - min) / (max - min)) * (width - 2 * padding)
}

const xToFreq = (x: number, width: number, padding: number) => {
  const min = Math.log10(20)
  const max = Math.log10(20000)
  const t = (x - padding) / (width - 2 * padding)
  return Math.pow(10, min + t * (max - min))
}

const dbToY = (db: number, height: number, padding: number) => {
  const min = -12
  const max = 12
  const t = (db - min) / (max - min)
  return height - padding - t * (height - 2 * padding)
}

const yToDb = (y: number, height: number, padding: number) => {
  const min = -12
  const max = 12
  const t = (height - padding - y) / (height - 2 * padding)
  return Math.max(min, Math.min(max, min + t * (max - min)))
}

const calculateCombinedResponse = (freq: number, bands: EQBand[]) => {
  let totalGain = 0
  bands.forEach(band => {
    const f = freq / band.frequency
    if (band.type === 'peaking') {
      const q = band.Q
      const g = band.gain
      const bandwidth = 1 / q
      const dist = Math.abs(Math.log2(f))
      totalGain += g * Math.exp(-(dist * dist) / (bandwidth * bandwidth))
    } else if (band.type === 'lowshelf') {
      const transition = 0.5 - Math.atan(Math.log2(f) * 2.5) / Math.PI
      totalGain += band.gain * transition
    } else if (band.type === 'highshelf') {
      const transition = 0.5 + Math.atan(Math.log2(f) * 2.5) / Math.PI
      totalGain += band.gain * transition
    } else if (band.type === 'highpass') {
      const f4 = Math.pow(f, 4)
      totalGain += 10 * Math.log10(f4 / (1 + f4))
    }
  })
  return totalGain
}

const calculateRawRoomResponse = (freq: number, profile: RoomProfile | null) => {
  if (!profile) return 0
  let deviation = 0
  Object.entries(profile.eqValues).forEach(([bandId, idealCorrection]) => {
    let bandFreq = 1000
    if (bandId === 'hpf') bandFreq = 20
    else if (bandId === 'low-shelf') bandFreq = 100
    else if (bandId === 'mid-1') bandFreq = 500
    else if (bandId === 'mid-2') bandFreq = 2000
    else if (bandId === 'high-shelf') bandFreq = 8000
    const f = freq / bandFreq
    const q = 0.8
    const bandwidth = 1 / q
    const dist = Math.abs(Math.log2(f))
    const rawDev = -idealCorrection
    deviation += rawDev * Math.exp(-(dist * dist) / (bandwidth * bandwidth))
  })
  const ripple = Math.sin(Math.log10(freq) * 20) * 0.35
  return deviation + ripple
}

const getAcousticAdvisorFeedback = (bands: EQBand[], profile: RoomProfile | null) => {
  if (!profile) {
    return {
      accuracy: 100,
      status: 'MONITOREO DIRECTO',
      color: 'text-success border-success/30 bg-success/5',
      accentColor: '#10b981',
      title: 'MEZCLA DIRECTA SIN CALIBRACIÓN',
      message: 'SALA TOTALMENTE NEUTRA O MONITOREO DIRECTO ACTIVO. LA CURVA DE ECUALIZACIÓN ACTUAL NO REQUIERE COMPENSACIÓN FÍSICA.'
    }
  }
  let totalDifference = 0
  let bandCount = 0
  bands.forEach(band => {
    const idealGain = profile.eqValues[band.id] ?? 0
    totalDifference += Math.abs(band.gain - idealGain)
    bandCount++
  })
  const averageDiff = bandCount > 0 ? (totalDifference / bandCount) : 0
  const accuracy = Math.max(0, Math.min(100, Math.round(100 - (averageDiff / 5) * 100)))
  if (accuracy >= 85) {
    return {
      accuracy,
      status: 'COMPENSADO',
      color: 'text-success border-success/30 bg-success/5',
      accentColor: '#10b981',
      title: '¡EXCELENTE CAMINO! COMPENSACIÓN ÓPTIMA',
      message: 'LA ECUALIZACIÓN ACTUAL COMPENSA PERFECTAMENTE LAS DEFICIENCIAS FÍSICAS DE TU SALA. EL SONIDO PREDICHO SERÁ ALTAMENTE PLANO Y FIEL.'
    }
  } else if (accuracy >= 60) {
    return {
      accuracy,
      status: 'ACEPTABLE',
      color: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5',
      accentColor: '#eab308',
      title: 'BUEN CAMINO (CORRECCIÓN PARCIAL)',
      message: 'ESTÁS COMPENSANDO LAS PRINCIPALES RESONANCIAS DE LA SALA. SE RECOMIENDA REFINAR LAS BANDAS MEDIAS PARA LOGRAR MEJOR REFERENCIA.'
    }
  } else if (accuracy >= 35) {
    return {
      accuracy,
      status: 'COLORACIÓN',
      color: 'text-blue-400 border-blue-400/30 bg-blue-500/5',
      accentColor: '#60a5fa',
      title: 'MODO CREATIVO / ESCUCHA SUBJETIVA',
      message: 'LA CURVA TIENE UN PROPÓSITO CREATIVO O DE DELEITE (COMO HI-FI O POP). DISFRUTABLE PARA ESCUCHAR MÚSICA, PERO NO RECOMENDADO PARA MEZCLAR.'
    }
  } else {
    return {
      accuracy,
      status: 'DESFAVORABLE',
      color: 'text-danger border-danger/30 bg-danger/5',
      accentColor: '#ff453a',
      title: '¡CUIDADO! AMPLIFICANDO RESONANCIAS',
      message: 'LA EQ ESTÁ EXACERBANDO LAS RESONANCIAS DE TU SALA EN LUGAR DE CORREGIRLAS. RIESGO ALTO DE MONITOREO ENGAÑOSO Y PÉRDIDA DE DETALLE.'
    }
  }
}

export const EQVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bands, setBands] = useState<EQBand[]>([])
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [activeProfile, setActiveProfile] = useState<RoomProfile | null>(null)
  const eqManager = AdaptiveEQManager.getInstance()

  useEffect(() => {
    const list = RoomProfileStorage.getAllProfiles()
    if (list.length > 0) {
      setActiveProfile(list[0])
    }
  }, [])

  useEffect(() => {
    setBands([...eqManager.getBands()])
    const canvas = canvasRef.current
    if (!canvas) return
    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      draw()
    })
    resizeObserver.observe(canvas)
    let animationId: number
    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const isLight = document.documentElement.getAttribute('data-theme') === 'light'
      const width = canvas.width
      const height = canvas.height
      const padding = 40 * window.devicePixelRatio
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)'
      ctx.lineWidth = 1
      ctx.font = `${9 * window.devicePixelRatio}px "JetBrains Mono", monospace`
      ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'
      const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
      frequencies.forEach(f => {
        const x = freqToX(f, width, padding)
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, height - padding)
        ctx.stroke()
        const label = f >= 1000 ? `${f/1000}k` : `${f}`
        ctx.fillText(label, x - ctx.measureText(label).width / 2, height - padding + 15 * window.devicePixelRatio)
      })
      const dbs = [-12, -6, 0, 6, 12]
      dbs.forEach(db => {
        const y = dbToY(db, height, padding)
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(width - padding, y)
        ctx.stroke()
        if (db === 0) {
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)'
          ctx.stroke()
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)'
        }
        ctx.fillText(`${db}dB`, padding - 35 * window.devicePixelRatio, y + 4 * window.devicePixelRatio)
      })
      if (activeProfile) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'
        ctx.lineWidth = 1.5 * window.devicePixelRatio
        ctx.setLineDash([4 * window.devicePixelRatio, 4 * window.devicePixelRatio])
        for (let x = padding; x < width - padding; x++) {
          const freq = xToFreq(x, width, padding)
          const rawResponse = calculateRawRoomResponse(freq, activeProfile)
          const y = dbToY(rawResponse, height, padding)
          if (x === padding) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.beginPath()
      ctx.strokeStyle = '#ff8c00'
      ctx.lineWidth = 2.5 * window.devicePixelRatio
      ctx.lineJoin = 'round'
      for (let x = padding; x < width - padding; x++) {
        const freq = xToFreq(x, width, padding)
        const response = calculateCombinedResponse(freq, bands)
        const y = dbToY(response, height, padding)
        if (x === padding) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.lineTo(width - padding, height - padding)
      ctx.lineTo(padding, height - padding)
      const fillGrad = ctx.createLinearGradient(0, padding, 0, height - padding)
      fillGrad.addColorStop(0, 'rgba(255, 140, 0, 0.03)')
      fillGrad.addColorStop(1, 'rgba(255, 140, 0, 0)')
      ctx.fillStyle = fillGrad
      ctx.fill()
      if (activeProfile) {
        ctx.beginPath()
        ctx.strokeStyle = '#00f2fe'
        ctx.lineWidth = 2 * window.devicePixelRatio
        ctx.lineJoin = 'round'
        ctx.shadowColor = '#00f2fe'
        ctx.shadowBlur = 4 * window.devicePixelRatio
        for (let x = padding; x < width - padding; x++) {
          const freq = xToFreq(x, width, padding)
          const rawRoom = calculateRawRoomResponse(freq, activeProfile)
          const eqVal = calculateCombinedResponse(freq, bands)
          const resulting = rawRoom + eqVal
          const y = dbToY(resulting, height, padding)
          if (x === padding) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      }
      bands.forEach(band => {
        const x = freqToX(band.frequency, width, padding)
        const y = dbToY(band.gain, height, padding)
        ctx.beginPath()
        ctx.arc(x, y, 6 * window.devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = isLight ? '#0f172a' : '#ffffff'
        ctx.fill()
        ctx.strokeStyle = '#ff8c00'
        ctx.lineWidth = 2.5 * window.devicePixelRatio
        ctx.stroke()
        if (isDragging === band.id) {
          ctx.beginPath()
          ctx.arc(x, y, 12 * window.devicePixelRatio, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255, 140, 0, 0.25)'
          ctx.lineWidth = 2 * window.devicePixelRatio
          ctx.stroke()
        }
      })
      animationId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationId)
    }
  }, [bands, eqManager, isDragging, activeProfile])

  const handleInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left) * window.devicePixelRatio
    const y = (clientY - rect.top) * window.devicePixelRatio
    const width = canvas.width
    const height = canvas.height
    const padding = 40 * window.devicePixelRatio
    if (isDragging) {
      const newDb = yToDb(y, height, padding)
      eqManager.setBandGain(isDragging, newDb)
      setBands([...eqManager.getBands()])
    } else {
      bands.forEach(band => {
        const bx = freqToX(band.frequency, width, padding)
        const by = dbToY(band.gain, height, padding)
        const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2)
        if (dist < 20 * window.devicePixelRatio) {
          setIsDragging(band.id)
        }
      })
    }
  }

  const handleDownloadReport = () => {
    if (!activeProfile) return
    downloadRoomReport({
      roomName: activeProfile.name,
      roomNotes: activeProfile.notes,
      analysis: {
        averageRMS: activeProfile.averageRMS,
        acousticRating: activeProfile.acousticRating,
        issues: activeProfile.issues,
        bandAverages: {
          subBass: activeProfile.averageRMS - 2,
          bass: activeProfile.averageRMS + 1,
          lowMids: activeProfile.averageRMS,
          mids: activeProfile.averageRMS - 1,
          highs: activeProfile.averageRMS - 4,
        }
      },
      recommendations: Object.entries(activeProfile.eqValues).map(([id, gain]) => {
        const freqMap: Record<string, number> = { 'hpf': 30, 'low-shelf': 100, 'mid-1': 500, 'mid-2': 2000, 'high-shelf': 8000 }
        const typeMap: Record<string, BiquadFilterType> = { 'hpf': 'highpass', 'low-shelf': 'lowshelf', 'mid-1': 'peaking', 'mid-2': 'peaking', 'high-shelf': 'highshelf' }
        return {
          id,
          frequency: freqMap[id] ?? 1000,
          type: typeMap[id] ?? 'peaking',
          suggestedGain: gain,
          q: 0.707,
          reason: 'Corrección correctiva calculada para este perfil de sala.'
        }
      }),
      currentBands: bands,
      advisorAccuracy: feedback.accuracy,
      advisorStatus: feedback.status,
      timestamp: new Date(),
    })
  }

  const feedback = getAcousticAdvisorFeedback(bands, activeProfile)

  return (
    <div className="flex flex-col h-full w-full gap-3 font-mono">
      {/* Visualizer Canvas Panel */}
      <GlassPanel className="p-0 overflow-hidden flex-grow relative" strong>
        <div className="absolute top-6 left-6 pointer-events-none z-20">
          <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
            PREDICCIÓN Y RESPUESTA DE FRECUENCIA
          </h4>
          <span className="text-[8px] text-accent uppercase tracking-widest block mt-1 font-bold">
            CURVAS FÍSICAS DE SALA + CORRECCIÓN DSP
          </span>
        </div>
        <div className="absolute top-6 right-6 pointer-events-none z-20 flex gap-4 text-[7.5px] font-bold uppercase tracking-wider bg-black/45 backdrop-blur px-2.5 py-1.5 rounded-xl border border-white/5 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-red-500/50" />
            <span className="text-text-soft">Sala Física Cruda</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-accent" />
            <span className="text-text-soft">Filtro EQ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#00f2fe]" />
            <span className="text-[#00f2fe]">Resultado Predicho</span>
          </div>
        </div>
        <canvas 
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none bg-[#080a0e]"
          onMouseDown={(e) => handleInteraction(e.clientX, e.clientY)}
          onMouseMove={(e) => { if (e.buttons === 1) handleInteraction(e.clientX, e.clientY) }}
          onMouseUp={() => setIsDragging(null)}
          onTouchStart={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={() => setIsDragging(null)}
        />
      </GlassPanel>

      {/* Real-time Acoustic Advisor + Report Button */}
      <GlassPanel className="p-3 flex-shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 border-white/5" style={{ background: 'var(--panel)' }} hoverEffect>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div 
            className="flex-shrink-0 w-11 h-11 rounded-full border flex flex-col items-center justify-center relative overflow-hidden select-none shadow-sm"
            style={{ borderColor: 'var(--border-strong)', background: 'var(--bg-elevated)' }}
          >
            <span className="text-[5.5px] text-text-muted font-bold uppercase tracking-widest block leading-none mb-0.5 relative z-10">CAMINO</span>
            <span className={`text-[11px] font-black leading-none relative z-10 ${
              feedback.accuracy >= 85 ? 'text-success' : 
              feedback.accuracy >= 60 ? 'text-yellow-500' : 
              feedback.accuracy >= 35 ? 'text-blue-400' : 'text-danger'
            }`}>
              {feedback.accuracy}%
            </span>
            <div 
              className="absolute bottom-0 left-0 w-full transition-all duration-300 opacity-20" 
              style={{ height: `${feedback.accuracy}%`, backgroundColor: feedback.accentColor }} 
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="text-[10px] font-black text-white uppercase tracking-wider">
                {activeProfile ? `ASESOR DE SALA: ${activeProfile.name}` : 'MONITOREO DIRECTO'}
              </h5>
              <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider leading-none ${feedback.color}`}>
                {feedback.status}
              </span>
            </div>
            <p className="text-[8px] text-accent uppercase tracking-widest block font-bold mt-1">
              {feedback.title}
            </p>
          </div>
        </div>

        {/* Message + Report Button - SIEMPRE VISIBLE */}
        <div className="flex-grow md:max-w-md w-full text-left md:text-right border-t md:border-t-0 md:border-l border-white/[0.04] pt-3 md:pt-0 md:pl-4 flex flex-col gap-2">
          <p className="text-[8.5px] text-text-soft leading-relaxed uppercase font-bold tracking-tight">
            {feedback.message}
          </p>
          <button
            onClick={handleDownloadReport}
            disabled={!activeProfile}
            className={`self-end flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition-all text-[9px] uppercase tracking-widest ${
              activeProfile
                ? 'bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent hover:text-white cursor-pointer'
                : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
            }`}
            title={activeProfile ? "Descargar informe de la sala calibrada" : "Calibra una sala primero para generar el informe"}
          >
            <FileDown className="w-3 h-3" />
            {activeProfile ? 'Descargar informe' : 'Sin perfil de sala'}
          </button>
        </div>
      </GlassPanel>
    </div>
  )
}