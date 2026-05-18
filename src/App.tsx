/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react'
import { AudioManager } from './core/audio/AudioManager'
import { AdaptiveEQManager } from './core/audio/AdaptiveEQManager'
import { ProfessionalSpectrum } from './features/analyzer/ProfessionalSpectrum'
import { ProfessionalTuner } from './features/tuner/ProfessionalTuner'
import { AdaptiveEQControls } from './features/eq/AdaptiveEQControls'
import { EQVisualizer } from './features/eq/EQVisualizer'
import { EQPresets } from './features/eq/EQPresets'
import { EQCalibration } from './features/calibrate/EQCalibration'

type Tab = 'analyzer' | 'tuner' | 'calibrate' | 'eq'
type Page = 'landing' | 'app'

// ── ICON HELPER ──────────────────────────────────────────────
function Icon({ name, className = '', filled = false, style }: {
  name: string
  className?: string
  filled?: boolean
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}), ...style }}
    >
      {name}
    </span>
  )
}

// ── LANDING PAGE ─────────────────────────────────────────────
function LandingPage({ onStart, error }: { onStart: () => void; error: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const dataRef = useRef<number[]>([])

  // Spectrum animation
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

      // Grid
      ctx.strokeStyle = 'rgba(86,67,52,0.25)'
      ctx.lineWidth = 1
      for (let y = 0; y < H; y += H / 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      const barW = (W - 48) / BAR_COUNT
      dataRef.current.forEach((val, i) => {
        const base = 0.07 + 0.6 * Math.exp(-Math.pow(i / BAR_COUNT - 0.3, 2) / 0.06)
        dataRef.current[i] = Math.max(0.03, Math.min(1, val * 0.87 + base * 0.13 + (Math.random() - 0.5) * 0.06))
        const bH = dataRef.current[i] * (H - 24)
        const x = 40 + i * barW
        const grad = ctx.createLinearGradient(0, H - bH, 0, H)
        grad.addColorStop(0, 'rgba(255,140,0,0.9)')
        grad.addColorStop(1, 'rgba(255,140,0,0.2)')
        ctx.fillStyle = grad
        ctx.fillRect(x + 1, H - bH, barW - 2, bH)
      })

      // dB labels
      ctx.fillStyle = 'rgba(221,193,174,0.35)'
      ctx.font = `${9 * devicePixelRatio / devicePixelRatio}px JetBrains Mono`
      ;['0dB', '-12', '-24', '-36', '-48'].forEach((l, i) => {
        ctx.fillText(l, 2, 8 + i * (H - 24) / 4)
      })

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-lowest)' }}>

      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--outline-var)' }}
        className="sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-4 md:px-8 max-w-[1440px] mx-auto" style={{ height: 64 }}>
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold" style={{ color: 'var(--primary-c)', letterSpacing: '-0.02em' }}>
              FreqLens
            </span>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Analyze', active: true },
                { label: 'Calibrate', active: false },
                { label: 'Tune', active: false },
                { label: 'Library', active: false },
              ].map(item => (
                <a
                  key={item.label}
                  onClick={item.label !== 'Analyze' ? onStart : undefined}
                  className="flex items-center px-3 text-xs font-semibold tracking-widest uppercase cursor-pointer transition-colors"
                  style={{
                    height: 64,
                    color: item.active ? 'var(--primary)' : 'var(--on-surface-var)',
                    borderBottom: item.active ? '2px solid var(--primary-c)' : '2px solid transparent',
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onStart}
              className="hidden md:flex items-center gap-2 text-xs font-bold tracking-widest uppercase rounded cursor-pointer transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'var(--primary-c)', color: 'var(--on-primary-c)', padding: '8px 20px' }}
            >
              <Icon name="play_arrow" className="text-sm" />
              Start Audio Engine
            </button>
            <Icon name="settings_input_component" className="cursor-pointer p-2 rounded-full transition-colors" style={{ color: 'var(--primary)' }} />
            <Icon name="account_circle" className="cursor-pointer p-2 rounded-full transition-colors" style={{ color: 'var(--primary)' }} />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 pb-16 px-4 md:px-8 max-w-[1440px] mx-auto overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[260px] rounded-full pointer-events-none"
            style={{ background: 'rgba(255,140,0,0.04)', filter: 'blur(80px)' }} />

          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-14 anim-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6"
              style={{ background: 'var(--surface-high)', border: '1px solid var(--outline-var)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--primary-c)' }} />
              <span className="mono text-xs uppercase tracking-tighter" style={{ color: 'var(--primary)' }}>
                100% CLIENT-SIDE DSP | BIT-PERFECT
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Análisis de audio{' '}
              <span style={{ color: 'var(--primary-c)' }}>de precisión absoluta</span>
            </h1>
            <p className="text-base mb-10 max-w-2xl leading-relaxed" style={{ color: 'var(--on-surface-var)' }}>
              Plataforma PWA de alta fidelidad para calibración de sala, afinación cromática y ecualización adaptativa.
              Privacidad total: tus datos nunca salen del navegador.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onStart}
                className="text-lg font-bold rounded cursor-pointer transition-all active:scale-95 hover:brightness-110"
                style={{ background: 'var(--primary-c)', color: 'var(--on-primary-c)', padding: '16px 40px', letterSpacing: '0.04em' }}
              >
                INICIAR MOTOR DE AUDIO
              </button>
              <button
                className="text-lg font-bold rounded cursor-pointer transition-all active:scale-95"
                style={{ border: '1px solid var(--primary-c)', color: 'var(--primary-c)', padding: '16px 40px', background: 'transparent', letterSpacing: '0.04em' }}
              >
                DOCUMENTACIÓN
              </button>
            </div>

            {error && (
              <p className="mt-6 text-sm px-4 py-2 rounded-lg" style={{ color: 'var(--error)', background: 'rgba(147,0,10,0.15)', border: '1px solid rgba(255,180,171,0.2)' }}>
                {error}
              </p>
            )}
          </div>

          {/* Spectrum showcase */}
          <div className="anim-2 relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl"
            style={{ border: '1px solid var(--outline-var)', background: 'var(--surface-low)' }}>
            {/* Titlebar */}
            <div className="flex items-center justify-between px-4 py-2"
              style={{ background: 'var(--surface-c)', borderBottom: '1px solid var(--outline-var)' }}>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(147,0,10,0.5)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,140,0,0.3)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'var(--surface-high)' }} />
              </div>
              <span className="mono text-xs uppercase tracking-widest" style={{ color: 'rgba(221,193,174,0.4)' }}>
                FREQLENS::RTA_PRO — LIVE PREVIEW
              </span>
              <span className="mono text-xs" style={{ color: 'rgba(255,183,125,0.4)' }}>BUFF: 1024</span>
            </div>
            <canvas ref={canvasRef} className="w-full" style={{ height: 200, display: 'block', background: 'var(--surface-lowest)' }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(12,14,18,0.5) 0%, transparent 40%)' }} />
          </div>
        </section>

        {/* Bento grid */}
        <section className="px-4 md:px-8 max-w-[1440px] mx-auto py-20 anim-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4" style={{ minHeight: 480 }}>

            {/* Main card */}
            <div className="md:col-span-8 rounded-xl p-8 flex flex-col justify-between relative glow-hover transition-all duration-300"
              style={{ background: 'var(--surface-c)', border: '1px solid var(--outline-var)' }}>
              <div className="absolute top-0 right-0 p-6 select-none pointer-events-none" style={{ opacity: 0.04 }}>
                <Icon name="equalizer" style={{ fontSize: 140 }} />
              </div>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <Icon name="equalizer" filled className="text-4xl" style={{ color: 'var(--primary-c)' }} />
                  <span className="mono text-xs px-2 py-1 rounded" style={{ color: 'var(--on-surface-var)', border: '1px solid var(--outline-var)' }}>
                    RTA_PRO_V2
                  </span>
                </div>
                <h3 className="text-3xl font-semibold mb-4" style={{ color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
                  Espectroscopia de Tiempo Real
                </h3>
                <p className="text-base leading-relaxed max-w-md" style={{ color: 'var(--on-surface-var)' }}>
                  Visualización de alta densidad con resolución de 1/48 de octava. Algoritmos FFT optimizados para baja latencia en entornos WebAssembly.
                </p>
              </div>
              <div className="mt-8 pt-6 flex gap-8" style={{ borderTop: '1px solid var(--outline-var)' }}>
                {[['LATENCIA', '2.4ms'], ['RESOLUCIÓN', '64-BIT'], ['FFT SIZE', '16384']].map(([label, val]) => (
                  <div key={label} className="flex flex-col">
                    <span className="mono text-xs uppercase tracking-widest" style={{ color: 'var(--on-surface-var)', fontSize: 10 }}>{label}</span>
                    <span className="text-2xl font-bold mt-1" style={{ color: 'var(--primary-c)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calibrate card */}
            <div onClick={onStart} className="md:col-span-4 rounded-xl p-6 flex flex-col justify-between glow-hover transition-all duration-300 cursor-pointer group active:scale-[0.98]"
              style={{ background: 'var(--surface-low)', border: '1px solid var(--outline-var)' }}>
              <div>
                <Icon name="architecture" className="mb-4 block" style={{ color: 'var(--primary)' }} />
                <span className="mono text-xs uppercase tracking-widest block mb-2" style={{ color: 'var(--primary)' }}>
                  Calibración de Sala
                </span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-var)' }}>
                  Compensación acústica basada en impulsos para monitores de estudio.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 transition-all group-hover:gap-3" style={{ color: 'var(--primary-c)' }}>
                <span className="text-xs font-semibold uppercase tracking-widest">Ir a Calibrar</span>
                <Icon name="arrow_forward" style={{ fontSize: 16 }} />
              </div>
            </div>

            {/* Privacy card */}
            <div className="md:col-span-4 rounded-xl p-6 flex flex-col justify-center"
              style={{ background: 'var(--primary-c)', border: '1px solid var(--primary-c)' }}>
              <Icon name="lock" filled className="text-3xl mb-4" style={{ color: 'var(--on-primary-c)' }} />
              <span className="mono text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: 'var(--on-primary-c)', opacity: 0.8 }}>
                Privacidad Radical
              </span>
              <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--on-primary-c)', opacity: 0.9 }}>
                Zero Cloud Policy. Todo el procesamiento ocurre localmente en tu CPU.
              </p>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <section className="overflow-hidden py-3" style={{ background: 'var(--surface-low)', borderTop: '1px solid var(--outline-var)', borderBottom: '1px solid var(--outline-var)' }}>
          <div className="marquee-track">
            {['WASM_READY', '192KHZ_SUPPORT', 'THD+N_ANALYSIS', 'ASYNC_DSP', 'PHASE_CORRELATION', 'LOW_LATENCY', 'ZERO_CLOUD', 'BIT_PERFECT',
              'WASM_READY', '192KHZ_SUPPORT', 'THD+N_ANALYSIS', 'ASYNC_DSP', 'PHASE_CORRELATION', 'LOW_LATENCY', 'ZERO_CLOUD', 'BIT_PERFECT'].map((label, i) => (
              <span key={i} className="mono text-xs flex items-center gap-2 pr-12" style={{ color: 'rgba(221,193,174,0.4)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary-c)' }} />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 px-4 md:px-8 max-w-[1440px] mx-auto text-center anim-4">
          <div className="rounded-2xl p-12 relative overflow-hidden"
            style={{ background: 'var(--surface-c)', border: '1px solid var(--outline-var)' }}>
            <div className="absolute top-0 right-0 p-4 font-black leading-none select-none pointer-events-none"
              style={{ fontSize: 100, color: 'rgba(255,183,125,0.04)' }}>PRO</div>
            <h2 className="text-3xl font-semibold mb-4" style={{ color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
              ¿Listo para la precisión absoluta?
            </h2>
            <p className="text-base mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--on-surface-var)' }}>
              Transforma cualquier navegador en una estación de trabajo de ingeniería acústica sin instalaciones pesadas.
            </p>
            <button
              onClick={onStart}
              className="text-lg font-bold rounded cursor-pointer transition-all active:scale-95"
              style={{
                background: 'var(--primary)', color: 'var(--on-primary)',
                padding: '20px 64px', letterSpacing: '0.04em',
                boxShadow: '0 0 0 0 rgba(255,183,125,0)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(255,183,125,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 0 rgba(255,183,125,0)' }}
            >
              ABRIR CONSOLA V2.0
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--surface-lowest)', borderTop: '1px solid var(--outline-var)' }}>
        <div className="py-10 px-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold" style={{ color: 'var(--primary-c)' }}>FreqLens Lab.</span>
            <span className="mono text-xs" style={{ color: 'var(--on-surface-var)', fontSize: 11 }}>
              © 2026 FreqLens — Trabajo Fin de Grado DAM
            </span>
          </div>
          <div className="flex gap-6">
            {['Documentation', 'Engine API', 'Privacy', 'Support'].map(l => (
              <a key={l} className="mono text-xs cursor-pointer transition-colors" style={{ color: 'var(--on-surface-var)', fontSize: 11 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--on-surface-var)')}>
                {l}
              </a>
            ))}
          </div>
          <div className="flex gap-3">
            <Icon name="terminal" className="cursor-pointer transition-colors" style={{ color: 'var(--secondary)' }} />
            <Icon name="waves" className="cursor-pointer transition-colors" style={{ color: 'var(--secondary)' }} />
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center"
        style={{ height: 64, background: 'var(--surface-c)', borderTop: '1px solid var(--outline-var)' }}>
        {[
          { icon: 'query_stats', label: 'Analyze', active: true },
          { icon: 'settings_input_component', label: 'Calibrate', active: false },
          { icon: 'tune', label: 'Tune', active: false },
          { icon: 'folder_open', label: 'Library', active: false },
        ].map(item => (
          <button key={item.label} onClick={item.label !== 'Analyze' ? onStart : undefined}
            className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl transition-transform active:scale-90 cursor-pointer"
            style={{ color: item.active ? 'var(--primary)' : 'var(--secondary)', background: item.active ? 'var(--surface-variant)' : 'transparent' }}>
            <Icon name={item.icon} style={{ fontSize: 20 }} />
            <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ── APP SHELL (post-start) ────────────────────────────────────
const TAB_CONFIG: { id: Tab; icon: string; label: string }[] = [
  { id: 'analyzer',  icon: 'equalizer',             label: 'Dashboard'   },
  { id: 'calibrate', icon: 'architecture',           label: 'Calibration' },
  { id: 'tuner',     icon: 'music_note',             label: 'Tuning'      },
  { id: 'eq',        icon: 'graphic_eq',             label: 'EQ'          },
]

function AppShell({ activeTab, setActiveTab, eqUpdateKey, setEqUpdateKey }: {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  eqUpdateKey: number
  setEqUpdateKey: (fn: (n: number) => number) => void
}) {
  const [engineRunning, setEngineRunning] = useState(false)

  const toggleEngine = useCallback(() => setEngineRunning(v => !v), [])

  return (
    <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden', background: 'var(--surface-lowest)' }}>

      {/* Top bar */}
      <header className="flex justify-between items-center flex-shrink-0 px-4 md:px-8"
        style={{ height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--outline-var)', zIndex: 50 }}>
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold" style={{ color: 'var(--primary-c)', letterSpacing: '-0.02em' }}>FreqLens</span>
          <nav className="hidden md:flex gap-1 items-center">
            {TAB_CONFIG.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-3 py-1 rounded text-sm font-medium cursor-pointer transition-colors"
                style={{
                  color: activeTab === t.id ? 'var(--primary)' : 'var(--on-surface-var)',
                  borderBottom: activeTab === t.id ? '2px solid var(--primary-c)' : '2px solid transparent',
                  background: 'transparent',
                }}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleEngine}
            className="hidden md:flex items-center gap-2 text-xs font-bold tracking-widest uppercase rounded cursor-pointer transition-all hover:brightness-110 active:scale-95"
            style={{
              background: engineRunning ? 'var(--error-c)' : 'var(--primary-c)',
              color: engineRunning ? 'var(--error)' : 'var(--on-primary-c)',
              padding: '8px 16px',
            }}>
            <Icon name={engineRunning ? 'stop' : 'play_arrow'} style={{ fontSize: 16 }} />
            {engineRunning ? 'Stop Engine' : 'Start Audio Engine'}
          </button>
          <Icon name="settings_input_component" className="p-2 rounded-full cursor-pointer transition-colors" style={{ color: 'var(--on-surface-var)' }} />
          <Icon name="account_circle" className="p-2 rounded-full cursor-pointer transition-colors" style={{ color: 'var(--on-surface-var)' }} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col flex-shrink-0 p-4"
          style={{ width: 224, background: 'var(--surface-lowest)', borderRight: '1px solid var(--outline-var)' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--primary-c)' }}>FreqLens Pro</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: engineRunning ? 'var(--primary-c)' : 'var(--primary)' }} />
              <span className="mono text-xs" style={{ color: 'var(--secondary)', fontSize: 11 }}>
                Engine: {engineRunning ? 'Running' : 'Standby'}
              </span>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            {TAB_CONFIG.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all duration-150"
                style={{
                  background: activeTab === t.id ? 'var(--primary-c)' : 'transparent',
                  color: activeTab === t.id ? 'var(--on-primary-c)' : 'var(--secondary)',
                }}>
                <Icon name={t.icon} style={{ fontSize: 20 }} />
                <span className="text-xs font-semibold tracking-wide">{t.label}</span>
              </button>
            ))}
          </nav>
          <button
            className="mt-auto w-full py-3 rounded-lg text-xs font-semibold tracking-wide cursor-pointer transition-colors"
            style={{ background: 'var(--surface-variant)', color: 'var(--primary)', border: '1px solid rgba(255,183,125,0.2)' }}>
            New Session
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: 'var(--background, #111317)' }}>
          {/* Content area — unchanged logic, new layout wrapper */}
          <div className="max-w-[1440px] mx-auto flex flex-col gap-6">

            {activeTab === 'analyzer' && (
              <>
                <div style={{ minHeight: 400 }}><ProfessionalSpectrum /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl" style={{ background: 'var(--surface-c)', border: '1px solid var(--outline-var)' }}>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface)', opacity: 0.5 }}>Smart Recommendation</h4>
                    <p className="text-xs leading-relaxed italic" style={{ color: 'var(--on-surface-var)' }}>
                      "Detectado exceso de energía en los 125Hz. El entorno podría presentar resonancias modales."
                    </p>
                  </div>
                  <div className="p-5 rounded-xl flex items-center justify-between" style={{ background: 'var(--surface-c)', border: '1px solid var(--outline-var)' }}>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--on-surface)', opacity: 0.5 }}>Room Calibration</h4>
                      <p className="mono uppercase tracking-widest" style={{ fontSize: 10, color: 'var(--primary)' }}>Status: Ready</p>
                    </div>
                    <button onClick={() => setActiveTab('calibrate')}
                      className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      style={{ background: 'var(--surface-high)', color: 'var(--primary)', border: '1px solid rgba(255,183,125,0.2)' }}>
                      RUN WIZARD
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2"><AdaptiveEQControls onUpdate={() => setEqUpdateKey(n => n + 1)} /></div>
                  <EngineSessionCard />
                </div>
              </>
            )}

            {activeTab === 'tuner' && (
              <>
                <div style={{ minHeight: 400 }}><ProfessionalTuner /></div>
                <EngineSessionCard />
              </>
            )}

            {activeTab === 'calibrate' && <EQCalibration />}

            {activeTab === 'eq' && (
              <div className="flex flex-col gap-6">
                <EQVisualizer key={eqUpdateKey} />
                <EQPresets onPresetApply={() => setEqUpdateKey(n => n + 1)} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden flex justify-around items-center flex-shrink-0"
        style={{ height: 64, background: 'var(--surface-c)', borderTop: '1px solid var(--outline-var)', zIndex: 50 }}>
        {TAB_CONFIG.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl cursor-pointer transition-transform active:scale-90"
            style={{ color: activeTab === t.id ? 'var(--primary)' : 'var(--secondary)', background: activeTab === t.id ? 'var(--surface-variant)' : 'transparent' }}>
            <Icon name={t.icon} style={{ fontSize: 20 }} />
            <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ── ENGINE SESSION CARD ───────────────────────────────────────
function EngineSessionCard() {
  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--surface-low)', border: '1px solid var(--outline-var)' }}>
      <h4 className="mono text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--primary)', fontSize: 11 }}>Engine Session</h4>
      <div className="space-y-3">
        {[
          ['Sample Rate', '48.0 kHz', false],
          ['Bit Depth', '32-bit Float', false],
          ['Latency', 'LOW-OVERHEAD', true],
        ].map(([label, val, accent]) => (
          <div key={label as string} className="flex justify-between items-center text-xs">
            <span className="mono uppercase tracking-tighter" style={{ color: 'var(--secondary)', fontSize: 10 }}>{label}</span>
            <span className="mono px-2 py-0.5 rounded"
              style={{
                color: accent ? 'var(--primary)' : 'var(--on-surface)',
                background: accent ? 'rgba(255,183,125,0.1)' : 'var(--surface-lowest)',
                border: accent ? '1px solid rgba(255,183,125,0.2)' : 'none',
              }}>
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ROOT ─────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState<Page>('landing')
  const [activeTab, setActiveTab] = useState<Tab>('analyzer')
  const [error, setError] = useState<string | null>(null)
  const [eqUpdateKey, setEqUpdateKey] = useState(0)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#eq=')) {
      try {
        const config = atob(hash.replace('#eq=', ''))
        const eqManager = AdaptiveEQManager.getInstance()
        config.split('|').forEach(part => {
          const [id, gain] = part.split(':')
          eqManager.setBandGain(id, parseFloat(gain))
        })
        setEqUpdateKey(n => n + 1)
      } catch {
        console.error('Failed to restore EQ config from URL')
      }
    }
  }, [])

  const handleStart = async () => {
    try {
      await AudioManager.getInstance().initialize()
      setPage('app')
    } catch {
      setError('Error al acceder al micrófono. Por favor, verifica los permisos.')
    }
  }

  if (page === 'landing') {
    return <LandingPage onStart={handleStart} error={error} />
  }

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      eqUpdateKey={eqUpdateKey}
      setEqUpdateKey={setEqUpdateKey}
    />
  )
}

export default App