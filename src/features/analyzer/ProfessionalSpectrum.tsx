/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity */
import { useEffect, useRef, useState, useMemo } from 'react'
import { AudioManager } from '../../core/audio/AudioManager'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { SmartAnalyzer, type AudioFeedback } from '../../core/audio/SmartAnalyzer'

interface SpectrumProps {
  width?: number
  height?: number
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

  ctx.beginPath()
  ctx.strokeStyle = theme.primary || '#00ffcc'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'

  const minFreq = 20
  const maxFreq = 22050
  const logMin = Math.log10(minFreq)
  const logMax = Math.log10(maxFreq)
  const logRange = logMax - logMin

  for (let i = 0; i < data.length; i++) {
    const freq = (i * 22050) / data.length
    if (freq < minFreq) continue

    const x = ((Math.log10(freq) - logMin) / logRange) * width
    const v = (data[i] + 100) / 100 
    const y = height - (Math.max(0, Math.min(1, v)) * height)
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  
  ctx.stroke()
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
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
  })
}

export const ProfessionalSpectrum = ({ 
  width = 800, 
  height = 400, 
  color = '#00ffcc' 
}: SpectrumProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const transferredRef = useRef(false)
  const [feedback, setFeedback] = useState<AudioFeedback[]>([])
  const [fps, setFps] = useState(0)
  const lastTimeRef = useRef(performance.now())
  const framesRef = useRef(0)

  const supportsOffscreen = useMemo(() => {
    return typeof OffscreenCanvas !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !supportsOffscreen || transferredRef.current) return

    const worker = new Worker(
      new URL('../../core/audio/spectrum.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker

    try {
      const offscreen = canvasRef.current.transferControlToOffscreen()
      transferredRef.current = true
      worker.postMessage({ 
        type: 'init', 
        payload: { canvas: offscreen } 
      }, [offscreen])
    } catch (e) {
      console.warn("Failed to transfer control to offscreen, falling back to main thread", e)
      worker.terminate()
      workerRef.current = null
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [supportsOffscreen])

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

    if (analyser) {
      const dataArray = new Float32Array(analyser.frequencyBinCount)
      analyser.getFloatFrequencyData(dataArray)
      
      if (framesRef.current === 1) {
        setFeedback(SmartAnalyzer.analyzeTonalBalance(dataArray, audioManager.getContext()?.sampleRate || 48000))
      }

      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'render',
          payload: {
            data: dataArray,
            width: canvasRef.current?.width || width,
            height: canvasRef.current?.height || height,
            theme: { primary: color }
          }
        })
      } else if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          renderSpectrum(ctx, dataArray, canvasRef.current.width || width, canvasRef.current.height || height, { primary: color })
        }
      }
    }
  }, true)

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="w-full h-full block"
      />
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded border border-white/10 text-[10px] font-mono text-slate-400 w-fit">
          FPS: {fps > 0 ? fps : '--'} | FFT: 4096 {workerRef.current ? '| Worker' : '| Main'}
        </div>
        {feedback.length > 0 && (
          <div className={`bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded border text-[10px] font-mono w-fit ${feedback[0].type === 'warning' ? 'text-amber-400 border-amber-500/50' : 'text-blue-400 border-blue-500/50'}`}>
            {feedback[0].message}
          </div>
        )}
      </div>
    </div>
  )
}
