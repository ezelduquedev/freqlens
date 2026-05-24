import { useEffect, useRef } from 'react'
import {
  Activity,
  ArrowRight,
  Cpu,
  Lock,
  Play,
  Terminal,
  Volume2
} from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel'
import { Button } from '../../ui/Button'

interface LandingPageProps {
  onStart: () => void;
  onDocs: () => void;
  error: string | null;
}

export function LandingPage({ onStart, onDocs, error }: LandingPageProps) {
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
      dataRef.current = Array.from({ length: BAR_COUNT }, () => Math.random())
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

      // Drawing spectrum
      const barWidth = W / BAR_COUNT
      ctx.fillStyle = 'rgba(255,140,0,0.15)'
      for (let i = 0; i < BAR_COUNT; i++) {
        // Slow random drift
        dataRef.current[i] += (Math.random() - 0.5) * 0.05
        dataRef.current[i] = Math.max(0.05, Math.min(0.95, dataRef.current[i]))

        const h = dataRef.current[i] * H * 0.7
        const x = i * barWidth
        const y = H - h
        ctx.fillRect(x + 1, y, barWidth - 2, h)
      }

      // Smooth envelope curve
      ctx.beginPath()
      ctx.strokeStyle = 'var(--accent)'
      ctx.lineWidth = 2
      for (let i = 0; i < BAR_COUNT; i++) {
        const h = dataRef.current[i] * H * 0.7
        const x = i * barWidth + barWidth / 2
        const y = H - h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Gradient Fill
      ctx.lineTo(W - barWidth/2, H)
      ctx.lineTo(barWidth/2, H)
      const fillGrad = ctx.createLinearGradient(0, 0, 0, H)
      fillGrad.addColorStop(0, 'rgba(255,140,0,0.08)')
      fillGrad.addColorStop(1, 'rgba(255,140,0,0)')
      ctx.fillStyle = fillGrad
      ctx.fill()

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
          <div className="flex items-center gap-3">
            {/* Brand logo (New official geometric design matching Sidebar) */}
            <div className="w-8 h-8 flex items-center justify-center animate-pulse drop-shadow-[0_0_10px_var(--accent-glow)] select-none">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="40" stroke="var(--accent)" strokeWidth="6" fill="none" />
                <path d="M 22 62 Q 35 62 42 45 Q 50 25 58 45 Q 65 62 78 62" stroke="var(--text)" strokeWidth="4" fill="none" strokeLinecap="round" />
                <circle cx="50" cy="48" r="5" fill="var(--text)" />
              </svg>
            </div>
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
            Análisis de audio{' '}
            <span className="bg-gradient-to-r from-accent to-[#ffaa33] bg-clip-text text-transparent">
              en tiempo real
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
            <Button variant="secondary" size="lg" onClick={onDocs}>Documentación</Button>
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
            <div className="h-56 w-full relative">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </GlassPanel>
        </section>

        {/* System Features grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 fade-up" style={{ animationDelay: '0.2s' }}>
          <GlassPanel className="md:col-span-8 flex flex-col justify-between min-h-[260px]">
            <div>
              <div className="flex items-center justify-between w-full mb-3">
                <span className="mono text-[9px] text-text-soft px-2 py-0.5 rounded border border-white/5 bg-white/[0.02] font-semibold">
                  RTA_ENGINE_PRO
                </span>
                <Activity className="w-5 h-5 text-accent" />
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
          <GlassPanel
            onClick={onStart}
            className="md:col-span-4 flex flex-col justify-between cursor-pointer active:scale-95 group transition-all duration-300 min-h-[260px]"
            hoverEffect
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
          </GlassPanel>

          {/* Privacy node */}
          <GlassPanel 
            onClick={onStart}
            className="md:col-span-4 flex flex-col justify-between min-h-[260px] bg-accent/5 border-accent/15 cursor-pointer active:scale-95 group transition-all duration-300"
            hoverEffect
          >
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
        <div className="max-w-[1200px] mx-auto px-6 flex justify-center">
          <a className="mono text-[10px] text-text-muted hover:text-accent cursor-pointer transition-colors" onClick={onDocs}>
            Documentación
          </a>
        </div>
      </footer>
    </div>
  )
}
