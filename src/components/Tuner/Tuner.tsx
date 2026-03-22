import { useRef, useCallback, useState } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { yinPitch, freqToNote } from '../../utils/notes'

interface Props {
  analyser: AnalyserNode
  audioContext: AudioContext
}

function Tuner({ analyser, audioContext }: Props) {
  const [a4, setA4]         = useState(440)
  const pitchSmoothRef      = useRef<number | null>(null)
  const canvasRef           = useRef<HTMLCanvasElement>(null)

  const [display, setDisplay] = useState({
    note: '--',
    octave: '',
    freq: '---',
    cents: 0,
    isSharp: false,
    hasSignal: false,
  })

  const draw = useCallback(() => {
    const buffer = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buffer)

    const pitch = yinPitch(buffer, audioContext.sampleRate)

    if (pitch > 20 && pitch < 20000) {
      pitchSmoothRef.current = pitchSmoothRef.current === null
        ? pitch
        : pitchSmoothRef.current * 0.7 + pitch * 0.3
    } else {
      pitchSmoothRef.current = null
    }

    if (pitchSmoothRef.current) {
      const result = freqToNote(pitchSmoothRef.current, a4)
      setDisplay({
        note:      result.isSharp ? result.note[0] : result.note,
        octave:    String(result.octave),
        freq:      pitchSmoothRef.current.toFixed(2),
        cents:     result.cents,
        isSharp:   result.isSharp,
        hasSignal: true,
      })
      drawNeedle(result.cents)
    } else {
      setDisplay(d => ({ ...d, hasSignal: false, note: '--', octave: '', freq: '---' }))
      drawNeedle(null)
    }
  }, [analyser, audioContext, a4])

  function drawNeedle(cents: number | null) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const cx     = W / 2
    const cy     = H * 0.85
    const radius = Math.min(W, H) * 0.7

    // Arco de fondo
    ctx.strokeStyle = '#1e1e35'
    ctx.lineWidth   = H * 0.1
    ctx.lineCap     = 'round'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI)
    ctx.stroke()

    // Zonas de color
    const zones = [
      { from: -50, to: -15, color: 'rgba(124,92,252,0.5)' },
      { from: -15, to: -3,  color: 'rgba(124,92,252,0.25)' },
      { from:  -3, to:  3,  color: 'rgba(251,146,60,0.9)' },
      { from:   3, to: 15,  color: 'rgba(124,92,252,0.25)' },
      { from:  15, to: 50,  color: 'rgba(124,92,252,0.5)' },
    ]
    zones.forEach(({ from, to, color }) => {
      ctx.strokeStyle = color
      ctx.lineWidth   = H * 0.1
      ctx.beginPath()
      ctx.arc(
        cx, cy, radius,
        Math.PI + ((from + 50) / 100) * Math.PI,
        Math.PI + ((to   + 50) / 100) * Math.PI
      )
      ctx.stroke()
    })

    // Marcas de tick
    for (let c = -50; c <= 50; c += 5) {
      const angle  = Math.PI + ((c + 50) / 100) * Math.PI
      const isBig  = c % 25 === 0
      const inner  = radius - (isBig ? H * 0.18 : H * 0.1)
      const outer  = radius + H * 0.02
      ctx.strokeStyle = isBig ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'
      ctx.lineWidth   = isBig ? 2 : 1
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
      ctx.stroke()
    }

    // Aguja
    if (cents !== null) {
      const clamped = Math.max(-50, Math.min(50, cents))
      const angle   = Math.PI + ((clamped + 50) / 100) * Math.PI
      const color   = Math.abs(cents) <= 3
        ? '#fb923c'
        : 'rgba(255,255,255,0.5)'

      ctx.strokeStyle = color
      ctx.lineWidth   = H * 0.04
      ctx.lineCap     = 'round'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(
        cx + Math.cos(angle) * radius * 0.85,
        cy + Math.sin(angle) * radius * 0.85
      )
      ctx.stroke()

      // Punto central
      ctx.fillStyle = '#fb923c'
      ctx.beginPath()
      ctx.arc(cx, cy, H * 0.05, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  useAnimationFrame(draw, true)

  const centsColor = !display.hasSignal
    ? 'text-white/20'
    : Math.abs(display.cents) <= 3
      ? 'text-orange-400'
      : 'text-purple-400'

  return (
    <div className="flex flex-col items-center justify-around h-full gap-4 py-4">

      {/* Nota */}
      <div className="flex flex-col items-center">
        <div className="flex items-start">
          <span className="font-mono text-8xl leading-none text-orange-400">
            {display.note}
          </span>
          {display.isSharp && (
            <span className="font-mono text-3xl text-yellow-400 mt-2">♯</span>
          )}
        </div>
        <span className="font-mono text-2xl text-white/30">
          {display.octave}
        </span>
        <span className="font-mono text-sm text-white/30 mt-1">
          {display.hasSignal ? `${display.freq} Hz` : '--- Hz'}
        </span>
      </div>

      {/* Medidor de aguja */}
      <div className="w-full max-w-sm">
        <canvas
          ref={canvasRef}
          className="w-full"
          width={400}
          height={160}
        />
        <div className="flex justify-between px-2 mt-1">
          {['-50¢', '-25¢', '0¢', '+25¢', '+50¢'].map(l => (
            <span key={l} className="font-mono text-xs text-white/20">{l}</span>
          ))}
        </div>
      </div>

      {/* Cents y badge */}
      <div className="flex flex-col items-center gap-2">
        <span className={`font-mono text-4xl ${centsColor}`}>
          {display.hasSignal
            ? (display.cents >= 0 ? '+' : '') + display.cents + ' ¢'
            : '-- ¢'
          }
        </span>
        {display.hasSignal && Math.abs(display.cents) <= 3 && (
          <span className="font-mono text-xs tracking-widest bg-orange-400 text-black px-4 py-1 rounded">
            IN TUNE
          </span>
        )}
      </div>

      {/* A4 configurable */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded">
        <span className="font-mono text-xs text-white/30 tracking-widest">A4 =</span>
        <input
          type="number"
          value={a4}
          min={410}
          max={470}
          onChange={e => setA4(Number(e.target.value))}
          className="bg-transparent font-mono text-sm text-orange-400 w-14 text-center outline-none"
        />
        <span className="font-mono text-xs text-white/30">Hz</span>
      </div>

    </div>
  )
}

export default Tuner