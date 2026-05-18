import { useRef, useCallback, useState } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { yinPitch, freqToNote } from '../../utils/notes'

// Definimos la interfaz aquí mismo para evitar errores de importación 
// y asegurar que coincida exactamente con lo que devuelve freqToNote
interface NoteResult {
  note: string
  octave: number
  cents: number
  isSharp: boolean
  frequency: number
}

interface Props {
  analyser: AnalyserNode
  audioContext: AudioContext
}

function Tuner({ analyser, audioContext }: Props) {
  const [a4, setA4] = useState(440)
  const pitchSmoothRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [display, setDisplay] = useState({
    note: '--',
    octave: '',
    freq: '---',
    cents: 0,
    isSharp: false,
    hasSignal: false,
  })

  const drawNeedle = useCallback((cents: number | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const cx = W / 2
    const cy = H * 0.85
    const radius = Math.min(W, H) * 0.7

    ctx.strokeStyle = '#1e1e35'
    ctx.lineWidth = H * 0.1
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI)
    ctx.stroke()

    const zones = [
      { from: -50, to: -15, color: 'rgba(124,92,252,0.3)' },
      { from: -15, to: -3,  color: 'rgba(124,92,252,0.1)' },
      { from:  -3, to:  3,  color: 'rgba(251,146,60,0.9)' },
      { from:   3, to: 15,  color: 'rgba(124,92,252,0.1)' },
      { from:  15, to: 50,  color: 'rgba(124,92,252,0.3)' },
    ]
    zones.forEach(({ from, to, color }) => {
      ctx.strokeStyle = color
      ctx.lineWidth = H * 0.1
      ctx.beginPath()
      ctx.arc(cx, cy, radius, Math.PI + ((from + 50) / 100) * Math.PI, Math.PI + ((to + 50) / 100) * Math.PI)
      ctx.stroke()
    })

    if (cents !== null) {
      const clamped = Math.max(-50, Math.min(50, cents))
      const angle = Math.PI + ((clamped + 50) / 100) * Math.PI
      const color = Math.abs(cents) <= 3 ? '#fb923c' : 'rgba(255,255,255,0.6)'

      ctx.strokeStyle = color
      ctx.lineWidth = H * 0.04
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * radius * 0.85, cy + Math.sin(angle) * radius * 0.85)
      ctx.stroke()

      ctx.fillStyle = '#fb923c'
      ctx.beginPath()
      ctx.arc(cx, cy, H * 0.05, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [])

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
      const result = freqToNote(pitchSmoothRef.current, a4) as NoteResult
      
      setDisplay({
        note: result.isSharp ? result.note[0] : result.note,
        octave: String(result.octave),
        freq: pitchSmoothRef.current.toFixed(2),
        cents: result.cents,
        isSharp: result.isSharp,
        hasSignal: true,
      })
      drawNeedle(result.cents)
    } else {
      setDisplay(d => ({ ...d, hasSignal: false, note: '--', octave: '', freq: '---' }))
      drawNeedle(null)
    }
  }, [analyser, audioContext, a4, drawNeedle])

  useAnimationFrame(draw, true)

  const centsColor = !display.hasSignal
    ? 'text-white/20'
    : Math.abs(display.cents) <= 3
      ? 'text-orange-400'
      : 'text-purple-400'

  return (
    <div className="flex flex-col items-center justify-around h-full gap-4 py-4 select-none">
      <div className="flex flex-col items-center">
        <div className="flex items-start">
          <span className="font-mono text-8xl leading-none text-orange-400 font-bold">
            {display.note}
          </span>
          {display.isSharp && (
            <span className="font-mono text-3xl text-orange-300 mt-2">♯</span>
          )}
        </div>
        <div className="flex flex-col items-center -mt-2">
          <span className="font-mono text-2xl text-white/40 tracking-tighter uppercase">
            Octave {display.octave}
          </span>
          <span className="font-mono text-xs text-white/20 mt-1 uppercase tracking-widest">
            {display.hasSignal ? `${display.freq} Hz` : 'Waiting for signal...'}
          </span>
        </div>
      </div>

      <div className="w-full max-w-sm relative">
        <canvas ref={canvasRef} className="w-full drop-shadow-2xl" width={400} height={180} />
        <div className="flex justify-between px-6 -mt-4">
          {['-50', '-25', '0', '+25', '+50'].map(l => (
            <span key={l} className="font-mono text-[10px] text-white/20 uppercase">{l}¢</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className={`font-mono text-5xl font-light tracking-tighter ${centsColor} transition-colors duration-300`}>
          {display.hasSignal ? (display.cents >= 0 ? '+' : '') + display.cents + '¢' : '--¢'}
        </span>
        <div className="h-6">
          {display.hasSignal && Math.abs(display.cents) <= 3 && (
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] bg-orange-400 text-slate-950 px-4 py-1 rounded-full animate-pulse">
              PERFECT PITCH
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-md">
        <span className="font-mono text-[10px] text-white/30 tracking-widest uppercase">Reference</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={a4}
            min={410}
            max={470}
            onChange={e => setA4(Number(e.target.value))}
            className="bg-transparent font-mono text-lg text-orange-400 w-12 text-center outline-none border-b border-orange-400/30 focus:border-orange-400 transition-colors"
          />
          <span className="font-mono text-xs text-white/30">Hz</span>
        </div>
      </div>
    </div>
  )
}

export default Tuner