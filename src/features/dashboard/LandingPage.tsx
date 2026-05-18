import { useEffect, useRef } from 'react'
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Lock,
  Play,
  Terminal,
  Volume2
} from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel'
import { Button } from '../../ui/Button'

interface LandingPageProps {
  onStart: () => void
  error: string | null
}

export function LandingPage({ onStart, error }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const dataRef = useRef<number[]>([])

  // Spectrum mock animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const BAR_COUNT = 64

    if (dataRef.current.length === 0) {
      dataRef.current = Array.from({ length: BAR_COUNT }, (_, i) => {
        const x = i / BAR_COUNT
        return 0.1 + 0.65 * Math.exp(-Math.pow(x - 0.3, 2) / 0.05) + 0.2 * Math.random()
      })
    }

    const draw = () => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      if (canvas.width !== W * devicePixelRatio) {
        canvas.width = W * devicePixelRatio
        canvas.height = H * devicePixelRatio
        ctx.scale(devicePixelRatio, devicePixelRatio)
      }
      ctx.clearRect(0, 0, W, H)

      // Grid Lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 1
      for (let y = 0; y < H; y += H / 5) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
      for (let x = 0; x < W; x += W / 8) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }

      const barW = (W - 80) / BAR_COUNT
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(255,140,0,0.8)'
      ctx.lineJoin = 'round'

      dataRef.current.forEach((val, i) => {
        const base = 0.07 + 0.6 * Math.exp(-Math.pow(i / BAR_COUNT - 0.3, 2) / 0.06)
        dataRef.current[i] = Math.max(
          0.03,
          Math.min(1, val * 0.88 + base * 0.12 + (Math.random() - 0.5) * 0.05)
        )
        const bH = dataRef.current[i] * (H - 40)
        const x = 40 + i * barW
        const y = H - bH - 10

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Area gradient under spectrum line
      ctx.lineTo(40 + (BAR_COUNT - 1) * barW, H)
      ctx.lineTo(40, H)
      const fillGrad = ctx.createLinearGradient(0, H - 120, 0, H)
      fillGrad.addColorStop(0, 'rgba(255,140,0,0.08)')
      fillGrad.addColorStop(1, 'rgba(255,140,0,0)')
      ctx.fillStyle = fillGrad
      ctx.fill()

      // dB Labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.font = '9px "JetBrains Mono", monospace'
      ;['0dB', '-12', '-24', '-36', '-48'].forEach((l, i) => {
        ctx.fillText(l, 8, 12 + i * (H - 40) / 4)
      })

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden flex flex-col relative">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none z-0 bg-accent/5 blur-[130px]" />
      
      {/* Header */}
      <header className="w-full h-16 border-b border-white/5 bg-black/10 backdrop-blur-md sticky top-0 z-50 select-none">
        <div className="max-w-[1200px] mx-auto h-full flex justify-between items-center px-6">
          <div className="flex items-center gap-6">
            <span className="text-base font-black tracking-widest text-accent font-mono">
              FREQLENS
            </span>
            <span className="hidden md:inline-block mono text-[10px] text-text-muted px-2 py-0.5 rounded border border-white/5 bg-white/[0.02]">
              DAM TFG v2.0
            </span>
          </div>

          <Button variant="primary" size="sm" onClick={onStart} icon={<Play className="w-3 h-3" />}>
            Iniciar Motor
          </Button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-grow z-10 max-w-[1200px] mx-auto w-full px-6 py-16 md:py-24 flex flex-col gap-16">
        
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            <span className="mono text-[9px] text-accent uppercase tracking-widest font-bold">
              DSP 100% en Cliente | Bit-Perfect
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Análisis de audio de{' '}
            <span className="bg-gradient-to-r from-accent to-[#ffaa33] bg-clip-text text-transparent">
              precisión absoluta
            </span>
          </h1>

          <p className="text-text-soft text-sm md:text-base max-w-2xl leading-relaxed">
            Plataforma PWA de alta fidelidad para calibración de sala, afinación cromática y ecualización adaptativa.
            Seguridad radical: tus flujos de audio se procesan localmente sin enviar datos a la nube.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button variant="primary" size="lg" onClick={onStart} icon={<Play className="w-4 h-4" />}>
              Abrir Consola de Audio
            </Button>
            <Button variant="secondary" size="lg" onClick={onStart}>
              Documentación
            </Button>
          </div>

          {error && (
            <div className="mt-4 px-4 py-2.5 rounded-xl border border-danger/20 bg-danger/5 text-danger mono text-xs">
              {error}
            </div>
          )}
        </section>

        {/* Live Preview Display */}
        <section className="fade-up" style={{ animationDelay: '0.1s' }}>
          <GlassPanel className="p-0 overflow-hidden border-white/10" strong>
            {/* Header bar */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-danger/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-accent/30" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/5" />
              </div>
              <span className="mono text-[9px] uppercase tracking-widest text-text-muted">
                FreqLens::RTA_OSCILLOSCOPE — PREVIEW_LIVE
              </span>
              <span className="mono text-[9px] text-accent/50 font-bold">FFT_SIZE: 2048</span>
            </div>
            {/* Canvas */}
            <canvas ref={canvasRef} className="w-full bg-[#080a0e]" style={{ height: 220, display: 'block' }} />
          </GlassPanel>
        </section>

        {/* Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 fade-up" style={{ animationDelay: '0.2s' }}>
          {/* Main Spectrum feature */}
          <GlassPanel className="md:col-span-8 flex flex-col justify-between min-h-[260px] relative overflow-hidden group hover:border-accent/20 transition-all" hoverEffect>
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none text-accent">
              <Activity style={{ fontSize: 160, width: 160, height: 160 }} />
            </div>
            <div>
              <div className="flex justify-between items-start mb-6">
                <Activity className="w-8 h-8 text-accent" />
                <span className="mono text-[9px] text-text-soft px-2 py-0.5 rounded border border-white/5 bg-white/[0.02] font-semibold">
                  RTA_ENGINE_PRO
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Espectroscopia de Tiempo Real
              </h3>
              <p className="text-text-soft text-xs md:text-sm leading-relaxed max-w-lg">
                Visualización espectral con resolución de 1/48 de octava y mapeo logarítmico. 
                Algoritmos FFT optimizados para baja latencia con procesamiento OffscreenCanvas asíncrono.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex gap-8">
              {[
                { label: 'Latencia', value: '2.4ms' },
                { label: 'Procesado', value: '32-Bit' },
                { label: 'FFT Bandas', value: '16384' }
              ].map(stat => (
                <div key={stat.label} className="flex flex-col">
                  <span className="mono text-[8px] uppercase tracking-widest text-text-muted font-bold">{stat.label}</span>
                  <span className="text-lg font-bold text-accent mt-0.5">{stat.value}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Calibrate card links */}
          <div
            onClick={onStart}
            className="md:col-span-4 rounded-[24px] border border-white/5 bg-white/[0.01] p-6 flex flex-col justify-between cursor-pointer hover:border-accent/25 hover:bg-white/[0.03] active:scale-95 group transition-all duration-300 min-h-[260px]"
          >
            <div>
              <Volume2 className="w-7 h-7 text-accent mb-4" />
              <span className="mono text-[9px] uppercase tracking-widest text-accent font-bold block mb-2">
                Calibración de Sala
              </span>
              <p className="text-text-soft text-xs leading-relaxed">
                Asistente de compensación acústica por impulsos para monitores de estudio. Calcula y ecualiza resonancias de sala en segundos.
              </p>
            </div>
            <div className="flex items-center gap-2 text-accent mt-4 group-hover:gap-3 transition-all duration-200">
              <span className="mono text-[10px] font-bold uppercase tracking-wider">Iniciar Calibración</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Privacy node */}
          <GlassPanel className="md:col-span-4 flex flex-col justify-between min-h-[240px] bg-accent/5 border-accent/15">
            <div>
              <Lock className="w-7 h-7 text-accent mb-4" />
              <span className="mono text-[9px] uppercase tracking-widest text-accent font-bold block mb-2">
                Privacidad Radical
              </span>
              <p className="text-text-soft text-xs leading-relaxed">
                Zero Cloud Policy. Todo el procesado DSP ocurre localmente en tu navegador. Tus flujos de micrófono jamás saldrán del sistema.
              </p>
            </div>
            <span className="mono text-[8px] uppercase tracking-widest text-accent/60 font-black mt-4 block">
              Nodo de Audio Web Seguro
            </span>
          </GlassPanel>

          {/* Technical Specs */}
          <GlassPanel className="md:col-span-4 flex flex-col justify-between min-h-[240px]" hoverEffect>
            <div>
              <Cpu className="w-7 h-7 text-accent mb-4" />
              <span className="mono text-[9px] uppercase tracking-widest text-text-soft font-bold block mb-2">
                Soporte WebAssembly
              </span>
              <p className="text-text-soft text-xs leading-relaxed">
                Rutinas matemáticas compiladas en WASM para rendimiento extremo. Tareas de renderizado delegadas a Web Workers dedicados.
              </p>
            </div>
            <span className="mono text-[8px] uppercase tracking-widest text-text-muted font-bold mt-4 block">
              Flujo DSP Multi-Hilo
            </span>
          </GlassPanel>

          {/* Standards compatibility */}
          <GlassPanel className="md:col-span-4 flex flex-col justify-between min-h-[240px]" hoverEffect>
            <div>
              <Terminal className="w-7 h-7 text-accent mb-4" />
              <span className="mono text-[9px] uppercase tracking-widest text-text-soft font-bold block mb-2">
                Soporte 192kHz
              </span>
              <p className="text-text-soft text-xs leading-relaxed">
                Compatibilidad nativa con las interfaces y tarjetas de audio más potentes del mercado sin remuestreo forzado.
              </p>
            </div>
            <span className="mono text-[8px] uppercase tracking-widest text-text-muted font-bold mt-4 block">
              Cumple con Audio Profesional
            </span>
          </GlassPanel>
        </section>

        {/* Marquee ticker */}
        <section className="overflow-hidden py-3.5 border-y border-white/5 bg-white/[0.01]">
          <div className="marquee-track select-none">
            {['WASM_READY', '192KHZ_SUPPORT', 'THD+N_ANALYSIS', 'ASYNC_DSP', 'PHASE_CORRELATION', 'LOW_LATENCY', 'ZERO_CLOUD', 'BIT_PERFECT'].map((label, i) => (
              <span key={i} className="mono text-[10px] text-text-muted flex items-center gap-2 pr-16 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                {label}
              </span>
            ))}
            {['WASM_READY', '192KHZ_SUPPORT', 'THD+N_ANALYSIS', 'ASYNC_DSP', 'PHASE_CORRELATION', 'LOW_LATENCY', 'ZERO_CLOUD', 'BIT_PERFECT'].map((label, i) => (
              <span key={`dup-${i}`} className="mono text-[10px] text-text-muted flex items-center gap-2 pr-16 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* CTA section */}
        <section className="fade-up" style={{ animationDelay: '0.3s' }}>
          <GlassPanel className="p-10 md:p-12 text-center relative overflow-hidden border-white/10" hoverEffect strong>
            <div className="absolute top-[-50px] right-[-50px] opacity-[0.02] pointer-events-none select-none text-[160px] font-black font-mono">
              PRO
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              ¿Listo para la precisión absoluta?
            </h2>
            <p className="text-text-soft text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Transforma cualquier navegador en una estación de trabajo de ingeniería acústica profesional sin descargas ni configuraciones complejas.
            </p>
            <Button variant="primary" size="lg" onClick={onStart} icon={<Play className="w-4 h-4" />}>
              Inicializar Consola FreqLens
            </Button>
          </GlassPanel>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-white/5 bg-black/20 select-none mt-auto z-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-extrabold text-white text-xs tracking-wider">FreqLens Lab.</span>
            <span className="mono text-[10px] text-text-muted">
              © 2026 FreqLens — Trabajo Fin de Grado DAM
            </span>
          </div>
          <div className="flex gap-6">
            {[['Documentación', 'Documentation'], ['API del Motor', 'Engine API'], ['Privacidad', 'Privacy'], ['Soporte', 'Support']].map(([label, l]) => (
              <a key={l} className="mono text-[10px] text-text-muted hover:text-accent cursor-pointer transition-colors">
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3 text-text-muted">
            <Terminal className="w-4 h-4 cursor-pointer hover:text-accent transition-colors" />
            <ShieldCheck className="w-4 h-4 cursor-pointer hover:text-accent transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  )
}
