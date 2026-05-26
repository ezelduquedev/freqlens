import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Cpu, AudioLines, Eye, RotateCcw, Check } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { AudioManager } from '../../core/audio/AudioManager'

// ── Types ─────────────────────────────────────────────────────────────
export interface FreqLensSettings {
  fftSize: 1024 | 2048 | 4096 | 8192
  smoothingTimeConstant: number   // 0.0 – 0.99
  referenceA4: number             // Hz
  peakHoldDecay: number           // ms
  yinThreshold: number            // 0.05 – 0.20
  displayFps: boolean
  displayFftInfo: boolean
}

export const DEFAULT_SETTINGS: FreqLensSettings = {
  fftSize: 4096,
  smoothingTimeConstant: 0.80,
  referenceA4: 440,
  peakHoldDecay: 1500,
  yinThreshold: 0.10,
  displayFps: true,
  displayFftInfo: true,
}

const STORAGE_KEY = 'freqlens_settings'

export function loadSettings(): FreqLensSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function persistSettings(s: FreqLensSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

// ── Sub-components ────────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
      <span className="text-accent">{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-text-soft">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <div>
        <p className="text-[11px] font-semibold text-text leading-none">{label}</p>
        {hint && <p className="text-[9px] text-text-muted mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  )
}

function Select<T extends string | number>({
  value, onChange, options,
}: {
  value: T
  onChange: (v: T) => void
  options: { label: string; value: T }[]
}) {
  return (
    <select
      value={value}
      onChange={e => {
        const raw = e.target.value
        // Cast back to number if original type is number
        onChange((typeof value === 'number' ? Number(raw) : raw) as T)
      }}
      className="bg-[var(--bg)] border border-white/[0.08] rounded-lg text-[10px] font-bold text-text font-mono px-2 py-1.5 cursor-pointer outline-none focus:border-accent/50 min-w-[110px]"
    >
      {options.map(o => (
        <option key={String(o.value)} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={clsx(
        'relative w-9 h-5 rounded-full border transition-all duration-200 cursor-pointer flex-shrink-0',
        value
          ? 'bg-accent border-accent/60 shadow-[0_0_10px_rgba(255,140,0,0.3)]'
          : 'bg-white/[0.06] border-white/[0.08]'
      )}
    >
      <span className={clsx(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
        value ? 'left-4' : 'left-0.5'
      )} />
    </button>
  )
}

function Slider({
  value, min, max, step, onChange, format,
}: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-28 h-1 bg-white/[0.08] rounded-full">
        <div
          className="absolute left-0 top-0 h-1 bg-accent rounded-full"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-5 -top-2"
        />
      </div>
      <span className="text-[10px] font-black text-accent font-mono min-w-[52px] text-right">
        {format(value)}
      </span>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────
interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<FreqLensSettings>(loadSettings)
  const [saved, setSaved] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  function set<K extends keyof FreqLensSettings>(key: K, val: FreqLensSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  function handleApply() {
    persistSettings(settings)
    // Apply to live AudioManager if running
    const analyser = AudioManager.getInstance().getAnalyser()
    if (analyser) {
      analyser.fftSize = settings.fftSize
      analyser.smoothingTimeConstant = settings.smoothingTimeConstant
    }
    // Notify same-tab listeners immediately
    window.dispatchEvent(new CustomEvent('freqlens-settings-changed'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS)
  }

  const fftResolution = (48000 / settings.fftSize).toFixed(1)
  const fftBins = settings.fftSize / 2

  return (
    <AnimatePresence>
      {open && (
        // Overlay
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={e => { if (e.target === overlayRef.current) onClose() }}
          className="fixed inset-0 z-[9999] flex items-start justify-end pt-[52px] pr-3"
        >
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-80 max-h-[calc(100vh-64px)] overflow-y-auto bg-[var(--panel-solid)] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] sticky top-0 bg-[var(--panel-solid)] z-10">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-text">
                  CONFIGURACIÓN
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 flex-1">

              {/* ── FFT Analysis ────────────────────────── */}
              <SectionHeader icon={<Cpu className="w-3.5 h-3.5" />} label="Análisis FFT" />

              <Row label="Tamaño FFT" hint={`${fftBins} bins · ~${fftResolution} Hz/bin`}>
                <Select
                  value={settings.fftSize}
                  onChange={v => set('fftSize', v as FreqLensSettings['fftSize'])}
                  options={[
                    { label: '1024  rápido', value: 1024 as const },
                    { label: '2048', value: 2048 as const },
                    { label: '4096  defecto', value: 4096 as const },
                    { label: '8192  preciso', value: 8192 as const },
                  ]}
                />
              </Row>

              <Row label="Suavizado" hint="Mayor valor → respuesta más lenta">
                <Slider
                  value={settings.smoothingTimeConstant} min={0} max={0.99} step={0.01}
                  onChange={v => set('smoothingTimeConstant', v)}
                  format={v => v.toFixed(2)}
                />
              </Row>

              <Row label="Decay peak hold" hint="Tiempo hasta que el pico baja">
                <Slider
                  value={settings.peakHoldDecay} min={200} max={5000} step={100}
                  onChange={v => set('peakHoldDecay', v)}
                  format={v => `${v}ms`}
                />
              </Row>

              {/* ── Tuner ───────────────────────────────── */}
              <SectionHeader icon={<AudioLines className="w-3.5 h-3.5" />} label="Afinador YIN" />

              <Row label="Referencia A4" hint="Frecuencia de afinación estándar">
                <Slider
                  value={settings.referenceA4} min={420} max={460} step={0.5}
                  onChange={v => set('referenceA4', v)}
                  format={v => `${v.toFixed(1)}Hz`}
                />
              </Row>

              <Row label="Umbral YIN" hint="Menor valor → más preciso pero inestable">
                <Slider
                  value={settings.yinThreshold} min={0.05} max={0.20} step={0.01}
                  onChange={v => set('yinThreshold', v)}
                  format={v => v.toFixed(2)}
                />
              </Row>

              {/* ── Display ─────────────────────────────── */}
              <SectionHeader icon={<Eye className="w-3.5 h-3.5" />} label="Visualización" />

              <Row label="Mostrar FPS" hint="Contador en la barra del analizador">
                <Toggle value={settings.displayFps} onChange={v => set('displayFps', v)} />
              </Row>

              <Row label="Mostrar info FFT" hint="FFT size y modo de procesamiento">
                <Toggle value={settings.displayFftInfo} onChange={v => set('displayFftInfo', v)} />
              </Row>

              {/* ── Session info card ────────────────────── */}
              <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-text-muted mb-2.5">
                  Sesión actual
                </p>
                {([
                  ['FFT size', `${settings.fftSize} muestras`],
                  ['Resolución', `~${fftResolution} Hz/bin`],
                  ['Ref. A4', `${settings.referenceA4.toFixed(1)} Hz`],
                  ['Peak decay', `${settings.peakHoldDecay} ms`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between mb-1.5 last:mb-0">
                    <span className="text-[9px] text-text-muted">{k}</span>
                    <span className="text-[9px] font-bold text-text-soft font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/[0.06] flex gap-2 sticky bottom-0 bg-[var(--panel-solid)]">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] text-[10px] font-bold text-text-muted hover:text-text hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer
              </button>
              <button
                onClick={handleApply}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer',
                  saved
                    ? 'bg-success/20 border border-success/40 text-success'
                    : 'bg-accent text-black hover:brightness-110 shadow-[0_0_12px_rgba(255,140,0,0.25)]'
                )}
              >
                {saved ? (
                  <><Check className="w-3 h-3" /> Guardado</>
                ) : (
                  'Aplicar cambios'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}