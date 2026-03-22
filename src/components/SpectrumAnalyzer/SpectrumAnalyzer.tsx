import { useRef, useCallback } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { binToFreq, freqToX, dbToY, calcRMS, formatFreq } from '../../utils/audio'

interface Props {
  analyser: AnalyserNode
  audioContext: AudioContext
}

// Colores del gradiente del espectro
const GRADIENT_TOP    = '#fb923c'  // naranja
const GRADIENT_BOTTOM = '#fbbf24'  // amarillo

const MIN_FREQ = 20
const MAX_FREQ = 20000
const MIN_DB   = -90
const MAX_DB   = -10

function SpectrumAnalyzer({ analyser, audioContext }: Props) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const waveCanvasRef  = useRef<HTMLCanvasElement>(null)
  const peakHoldRef    = useRef<Float32Array>(new Float32Array(8192).fill(MIN_DB))
  const peakFreqRef    = useRef(0)
  const peakAmpRef     = useRef(MIN_DB)
  const rmsRef         = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const waveCanvas = waveCanvasRef.current
    if (!canvas || !waveCanvas) return

    const ctx  = canvas.getContext('2d')
    const wCtx = waveCanvas.getContext('2d')
    if (!ctx || !wCtx) return

    const W = canvas.width
    const H = canvas.height
    const wW = waveCanvas.width
    const wH = waveCanvas.height

    const binCount   = analyser.frequencyBinCount
    const sampleRate = audioContext.sampleRate
    const freqData   = new Float32Array(binCount)
    const timeData   = new Uint8Array(analyser.fftSize)

    analyser.getFloatFrequencyData(freqData)
    analyser.getByteTimeDomainData(timeData)

    // ── Espectro ──
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(0, 0, W, H)

    // Grid de frecuencias
    const freqMarks = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
    freqMarks.forEach(f => {
      const x = freqToX(f, MIN_FREQ, MAX_FREQ, W)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(f >= 1000 ? (f / 1000) + 'k' : String(f), x, H - 4)
    })

    // Gradiente para las barras
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, GRADIENT_TOP)
    grad.addColorStop(1, GRADIENT_BOTTOM)

    let peakFreq = 0
    let peakAmp  = MIN_DB

    // Dibujar barras
    for (let i = 1; i < binCount; i++) {
      const freq = binToFreq(i, analyser.fftSize, sampleRate)
      if (freq < MIN_FREQ || freq > MAX_FREQ) continue

      const db  = freqData[i]
      const x1  = freqToX(freq, MIN_FREQ, MAX_FREQ, W)
      const x2  = freqToX(binToFreq(i + 1, analyser.fftSize, sampleRate), MIN_FREQ, MAX_FREQ, W)
      const barW = Math.max(1, x2 - x1)
      const y   = dbToY(db, MIN_DB, MAX_DB, H - 16)

      ctx.fillStyle = grad
      ctx.fillRect(x1, y, barW, H - 16 - y)

      // Peak hold
      if (db > peakHoldRef.current[i]) {
        peakHoldRef.current[i] = db
      } else {
        peakHoldRef.current[i] = Math.max(MIN_DB, peakHoldRef.current[i] - 0.3)
      }

      // Pico global
      if (db > peakAmp) {
        peakAmp  = db
        peakFreq = freq
      }
    }

    // Línea de peak hold
    ctx.strokeStyle = 'rgba(251,191,36,0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 1; i < binCount; i++) {
      const freq = binToFreq(i, analyser.fftSize, sampleRate)
      if (freq < MIN_FREQ || freq > MAX_FREQ) continue
      const x = freqToX(freq, MIN_FREQ, MAX_FREQ, W)
      const y = dbToY(peakHoldRef.current[i], MIN_DB, MAX_DB, H - 16)
      if (i === 1) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    peakFreqRef.current = peakFreq
    peakAmpRef.current  = peakAmp

    // RMS
    rmsRef.current = 20 * Math.log10(calcRMS(timeData) + 1e-10)

    // ── Forma de onda ──
    wCtx.clearRect(0, 0, wW, wH)
    wCtx.fillStyle = '#0f0f1a'
    wCtx.fillRect(0, 0, wW, wH)

    wCtx.strokeStyle = 'rgba(251,146,60,0.6)'
    wCtx.lineWidth = 1.5
    wCtx.beginPath()
    const sliceW = wW / timeData.length
    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128
      const y = (v * wH) / 2
      if (i === 0) wCtx.moveTo(0, y)
      else wCtx.lineTo(i * sliceW, y)
    }
    wCtx.stroke()

  }, [analyser, audioContext])

  useAnimationFrame(draw, true)

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Info chips */}
      <div className="flex gap-3 flex-wrap flex-shrink-0">
        {[
          { label: 'PICO',      value: () => formatFreq(peakFreqRef.current) },
          { label: 'AMPLITUD',  value: () => peakAmpRef.current.toFixed(1) + ' dB' },
          { label: 'RMS',       value: () => rmsRef.current.toFixed(1) + ' dB' },
        ].map(chip => (
          <div key={chip.label} className="flex flex-col bg-white/5 border border-white/10 px-3 py-2 rounded">
            <span className="font-mono text-xs text-white/30 tracking-widest">{chip.label}</span>
            <span className="font-mono text-sm text-orange-400">{chip.value()}</span>
          </div>
        ))}
      </div>

      {/* Canvas espectro */}
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-white/10">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width={1200}
          height={400}
        />
      </div>

      {/* Canvas forma de onda */}
      <div className="h-16 flex-shrink-0 rounded overflow-hidden border border-white/10">
        <canvas
          ref={waveCanvasRef}
          className="w-full h-full"
          width={1200}
          height={64}
        />
      </div>

    </div>
  )
}

export default SpectrumAnalyzer