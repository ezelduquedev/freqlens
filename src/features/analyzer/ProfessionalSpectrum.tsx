/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity */
import { useRef, useState } from 'react'
import { AudioManager } from '../../core/audio/AudioManager'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { SmartAnalyzer, type AudioFeedback } from '../../core/audio/SmartAnalyzer'
import { Activity, Radio, Cpu } from 'lucide-react'

interface SpectrumProps {
  color?: string
}

function renderSpectrum(
  ctx: CanvasRenderingContext2D, 
  data: Float32Array, 
  width: number, 
  height: number,
  theme: any
) {
  ctx.clearRect(0, 0, width, height)
  
  drawGrid(ctx, width, height)

  const accentColor = theme.primary || '#ff8c00'

  ctx.beginPath()
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'

  const minFreq = 20
  const maxFreq = 22050
  const logMin = Math.log10(minFreq)
  const logMax = Math.log10(maxFreq)
  const logRange = logMax - logMin

  let firstPoint = true
  for (let i = 0; i < data.length; i++) {
    const freq = (i * 22050) / data.length
    if (freq < minFreq) continue

    const x = ((Math.log10(freq) - logMin) / logRange) * width
    const v = (data[i] + 100) / 100 // Range -100dB to 0dB
    const y = height - (Math.max(0, Math.min(1, v)) * (height - 40) + 20) // Leave padding for clean edges
    
    if (firstPoint) {
      ctx.moveTo(x, y)
      firstPoint = false
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()

  // Draw area color gradient under line
  if (!firstPoint && data.length > 0) {
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    const fillGrad = ctx.createLinearGradient(0, 0, 0, height)
    fillGrad.addColorStop(0, 'rgba(255, 140, 0, 0.08)')
    fillGrad.addColorStop(1, 'rgba(255, 140, 0, 0.0)')
    ctx.fillStyle = fillGrad
    ctx.fill()
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Semi-transparent grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.lineWidth = 1
  
  const keyFreqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  const logMin = Math.log10(20)
  const logMax = Math.log10(22050)
  
  keyFreqs.forEach(f => {
    const x = ((Math.log10(f) - logMin) / (logMax - logMin)) * width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    // Technical minimal grid label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '9px "JetBrains Mono", monospace'
    const label = f >= 1000 ? `${f/1000}kHz` : `${f}Hz`
    ctx.fillText(label, x + 5, height - 10)
  })
}

export const ProfessionalSpectrum = ({ 
  color = '#ff8c00' 
}: SpectrumProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [feedback, setFeedback] = useState<AudioFeedback[]>([])
  const [fps, setFps] = useState(0)
  const [isSilent, setIsSilent] = useState(true)
  const lastTimeRef = useRef(performance.now())
  const framesRef = useRef(0)
  
  // DSP envelope hold to prevent rapid state flickering (1.5-second hold time)
  const activeHoldFramesRef = useRef(0)

  useAnimationFrame(() => {
    const audioManager = AudioManager.getInstance()
    const analyser = audioManager.getAnalyser()
    
    framesRef.current++
    const now = performance.now()
    if (now - lastTimeRef.current >= 1000) {
      setFps(framesRef.current)
      framesRef.current = 0
      lastTimeRef.current = now
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dynamic HDPI Retina Scaling
    const rect = canvas.getBoundingClientRect()
    const W = rect.width || 800
    const H = rect.height || 400
    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.resetTransform()
      ctx.scale(dpr, dpr)
    }

    if (analyser) {
      const dataArray = new Float32Array(analyser.frequencyBinCount)
      analyser.getFloatFrequencyData(dataArray)
      
      // Determine if there is active signal (any bin > -95dB)
      let silent = true
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > -95 && dataArray[i] !== -Infinity) {
          silent = false
          break
        }
      }

      if (!silent) {
        // Reset hold to 90 frames (~1.5 seconds at 60fps)
        activeHoldFramesRef.current = 90
      } else if (activeHoldFramesRef.current > 0) {
        activeHoldFramesRef.current--
      }

      const stableSilent = activeHoldFramesRef.current <= 0

      if (framesRef.current % 10 === 0) {
        setIsSilent(stableSilent)
      }
      
      if (framesRef.current === 1 && !stableSilent) {
        setFeedback(SmartAnalyzer.analyzeTonalBalance(dataArray, audioManager.getContext()?.sampleRate || 48000))
      }

      renderSpectrum(ctx, dataArray, W, H, { primary: color })
    } else {
      // Offline fallback: clear and draw grid lines so canvas is NEVER black!
      ctx.clearRect(0, 0, W, H)
      drawGrid(ctx, W, H)
      activeHoldFramesRef.current = 0
      if (framesRef.current % 10 === 0) {
        setIsSilent(true)
      }
    }
  }, true)

  return (
    <div className="relative w-full h-full bg-[#05070a] rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex flex-col">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
      
      {/* Floating Precision Meters & Status panels */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none select-none z-20">
        
        {/* Core telemetry */}
        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[9px] font-mono text-text-soft flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>FPS: {fps > 0 ? fps : '--'}</span>
          <span className="opacity-20">|</span>
          <span>FFT: 4096</span>
          <span className="opacity-20">|</span>
          <span className="text-accent font-bold uppercase">Main Thread</span>
        </div>

        {/* Signal Status Badge */}
        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[9px] font-mono flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isSilent ? 'bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]' : 'bg-success animate-ping shadow-[0_0_8px_rgba(48,209,88,0.6)]'}`} />
          <span className={isSilent ? 'text-text-muted font-bold' : 'text-success font-black'}>
            {isSilent ? 'SIN SEÑAL (ESPERANDO)' : 'MIC ACTIVO (EN VIVO)'}
          </span>
        </div>

        {/* Smart acoustic signal analyzer advisory warning banner */}
        {feedback.length > 0 && !isSilent && (
          <div className={`bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border text-[9px] font-mono flex items-center gap-2 ${feedback[0].type === 'warning' ? 'text-accent border-accent/25' : 'text-blue-400 border-blue-500/25'}`}>
            <Radio className="w-3.5 h-3.5" />
            <span>{feedback[0].message}</span>
          </div>
        )}
      </div>
      
      {/* Dynamic watermarks */}
      <div className="absolute bottom-4 right-4 pointer-events-none select-none mono text-[8px] uppercase tracking-widest text-text-muted flex items-center gap-1.5 z-20">
        <Cpu className="w-3.5 h-3.5" />
        <span>Nodo FreqLens RTA_PRO</span>
      </div>
    </div>
  )
}
