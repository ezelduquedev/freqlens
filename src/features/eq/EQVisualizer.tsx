/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react'
import { AdaptiveEQManager, type EQBand } from '../../core/audio/AdaptiveEQManager'

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
      if (freq < band.frequency) totalGain += band.gain
      else if (freq < band.frequency * 2) totalGain += band.gain * (1 - (freq - band.frequency) / band.frequency)
    } else if (band.type === 'highshelf') {
      if (freq > band.frequency) totalGain += band.gain
      else if (freq > band.frequency / 2) totalGain += band.gain * ((freq - band.frequency / 2) / (band.frequency / 2))
    } else if (band.type === 'highpass') {
      if (freq < band.frequency) totalGain -= 24
    }
  })
  return totalGain
}

export const EQVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bands, setBands] = useState<EQBand[]>([])
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const eqManager = AdaptiveEQManager.getInstance()

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

      const width = canvas.width
      const height = canvas.height
      const padding = 40 * window.devicePixelRatio
      
      ctx.clearRect(0, 0, width, height)

      // Draw Grid
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      ctx.font = `${10 * window.devicePixelRatio}px DM Mono`
      ctx.fillStyle = '#64748b'

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
          ctx.strokeStyle = '#334155'
          ctx.stroke()
          ctx.strokeStyle = '#1e293b'
        }
        ctx.fillText(`${db}dB`, padding - 35 * window.devicePixelRatio, y + 4 * window.devicePixelRatio)
      })

      // Draw Curve
      ctx.beginPath()
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 3 * window.devicePixelRatio
      ctx.lineJoin = 'round'

      for (let x = padding; x < width - padding; x++) {
        const freq = xToFreq(x, width, padding)
        const response = calculateCombinedResponse(freq, bands)
        const y = dbToY(response, height, padding)
        
        if (x === padding) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Draw Control Points
      bands.forEach(band => {
        const x = freqToX(band.frequency, width, padding)
        const y = dbToY(band.gain, height, padding)
        
        ctx.beginPath()
        ctx.arc(x, y, 6 * window.devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2 * window.devicePixelRatio
        ctx.stroke()
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationId)
    }
  }, [bands, eqManager])

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
      // Check for band selection
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

  return (
    <div className="w-full h-full min-h-[300px] bg-slate-900/30 rounded-3xl border border-slate-800 p-4 relative overflow-hidden group">
      <canvas 
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={(e) => handleInteraction(e.clientX, e.clientY)}
        onMouseMove={(e) => { if (e.buttons === 1) handleInteraction(e.clientX, e.clientY) }}
        onMouseUp={() => setIsDragging(null)}
        onTouchStart={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={() => setIsDragging(null)}
      />
      <div className="absolute top-6 left-6 pointer-events-none">
        <h3 className="text-white font-bold text-xs uppercase tracking-widest opacity-50">Frequency Response</h3>
        <p className="text-[10px] text-cyan-400 font-mono">LIVE DSP CURVE</p>
      </div>
    </div>
  )
}
