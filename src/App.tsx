import { useState, useEffect } from 'react'
import { AudioManager } from './core/audio/AudioManager'
import { AdaptiveEQManager } from './core/audio/AdaptiveEQManager'
import { ProfessionalTuner } from './features/tuner/ProfessionalTuner'
import { EQVisualizer } from './features/eq/EQVisualizer'
import { EQPresets } from './features/eq/EQPresets'
import { EQCalibration } from './features/calibrate/EQCalibration'
import { initTheme } from './utils/theme'

// New modular layouts & features
import { AppShell } from './layouts/AppShell'
import { type TabId } from './layouts/Sidebar'
import { LandingPage } from './features/dashboard/LandingPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import DocumentationPage from './features/docs/DocumentationPage'
import { SettingsPanel } from './features/settings/SettingsPanel' // ← añadido

import { GlassPanel } from './ui/GlassPanel'

type Page = 'landing' | 'app'

function App() {
  const [page, setPage] = useState<Page>('landing')
  const [activeTab, setActiveTab] = useState<TabId>('analyzer')
  const [error, setError] = useState<string | null>(null)
  const [eqUpdateKey, setEqUpdateKey] = useState(0)
  const [engineRunning, setEngineRunning] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    initTheme()
  }, [])

  // Listen to engine state changes from AudioManager
  useEffect(() => {
    const checkEngineState = () => {
      const audioManager = AudioManager.getInstance()
      const ctx = audioManager.getContext()
      setEngineRunning(!!ctx && ctx.state === 'running')
    }

    const interval = setInterval(checkEngineState, 500)
    return () => clearInterval(interval)
  }, [])

  // Restore parametric EQ state from URL Hash on mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#eq=')) {
      try {
        const config = atob(hash.replace('#eq=', ''))
        const eqManager = AdaptiveEQManager.getInstance()
        config.split('|').forEach((part) => {
          const [id, gain] = part.split(':')
          eqManager.setBandGain(id, parseFloat(gain))
        })
        setEqUpdateKey((n) => n + 1)
      } catch {
        console.error('Failed to restore EQ config from URL')
      }
    }
  }, [])

  // Prompt audio engine & microphone permission request
  const handleStart = async () => {
    try {
      await AudioManager.getInstance().initialize()
      setPage('app')
      setEngineRunning(true)
    } catch (err) {
      console.error(err)
      setError('Error al acceder al micrófono. Por favor, verifica los permisos en tu navegador.')
    }
  }

  // Toggle running state of audio engine
  const handleToggleEngine = async () => {
    const audioManager = AudioManager.getInstance()
    const ctx = audioManager.getContext()

    if (!ctx || ctx.state !== 'running') {
      await handleStart()
    } else {
      audioManager.dispose()
      setEngineRunning(false)
    }
  }

  // Render Landing stage
  if (page === 'landing') {
    return <LandingPage onStart={handleStart} onDocs={() => { setPage('app'); setActiveTab('docs'); }} error={error} />
  }

  return (
    <>
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        engineRunning={engineRunning}
        toggleEngine={handleToggleEngine}
        onSettingsClick={() => setSettingsOpen(true)}
      >
        {/* ── Tabs Router ── */}
        {activeTab === 'analyzer' && (
          <DashboardPage
            onRunWizard={() => setActiveTab('calibrate')}
            onUpdateEQ={() => setEqUpdateKey((n) => n + 1)}
          />
        )}

        {activeTab === 'tuner' && (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full min-h-0">
            <div className="flex-1 min-h-[350px] flex items-center justify-center bg-white/[0.01] border border-white/5 rounded-3xl p-6 relative">
              <ProfessionalTuner />
            </div>
            <div className="w-full lg:w-[360px] flex-shrink-0">
              <GlassPanel className="h-full flex flex-col justify-start gap-4.5 !p-5 border-white/5 bg-black/10 font-mono select-none" hoverEffect>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${engineRunning ? 'bg-accent shadow-[0_0_8px_var(--accent)]' : 'bg-white/20'}`} />
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-wider leading-none">
                        ESTADO DEL AFINADOR CROMÁTICO
                      </h4>
                      <span className="text-[7.5px] text-accent uppercase tracking-widest block mt-1.5 font-bold">
                        DETALLES DEL TONO DE SEÑAL DE ENTRADA
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-text-soft leading-relaxed mt-3">
                    Afinador cromático de alta resolución basado en el algoritmo de detección de tono YIN. Mide la frecuencia fundamental en Hz y calcula la desviación exacta en centésimas de semitono (Cents).
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 mt-1">
                  <div className="bg-white bg-black/35 border border-black/5 border-white/[0.03] p-3 rounded-2xl">
                    <span className="text-[7px] text-text-soft uppercase tracking-wider block font-bold">ALGORITMO DSP</span>
                    <span className="text-[14px] text-text-main text-white font-extrabold block mt-1">YIN Autocorrelation</span>
                    <span className="text-[7.5px] text-text-muted uppercase tracking-widest block mt-1 font-bold">MULTI-HILO A 60FPS</span>
                  </div>

                  <div className="bg-white bg-black/35 border border-black/5 border-white/[0.03] p-3 rounded-2xl">
                    <span className="text-[7px] text-text-soft uppercase tracking-wider block font-bold">RANGO DE ENTRADA</span>
                    <span className="text-[14px] text-text-main text-white font-extrabold block mt-1">20Hz - 2.5kHz</span>
                    <span className="text-[7.5px] text-text-muted uppercase tracking-widest block mt-1 font-bold">MIC / LÍNEA</span>
                  </div>

                  <div className="bg-white bg-black/35 border border-black/5 border-white/[0.03] p-3 rounded-2xl">
                    <span className="text-[7px] text-text-soft uppercase tracking-wider block font-bold">PRECISIÓN TEÓRICA</span>
                    <span className="text-[14px] text-accent font-extrabold block mt-1">&lt; 1 Cents</span>
                    <span className="text-[7.5px] text-text-muted uppercase tracking-widest block mt-1 font-bold">CALIDAD DE ESTUDIO</span>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {activeTab === 'calibrate' && (
          <EQCalibration onNavigateToEQ={() => setActiveTab('eq')} />
        )}

        {activeTab === 'eq' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start w-full">
            <div className="lg:col-span-3 h-[450px] lg:h-[520px] relative">
              <EQVisualizer key={eqUpdateKey} />
            </div>
            <div className="lg:col-span-1 h-auto flex flex-col">
              <EQPresets onPresetApply={() => setEqUpdateKey((n) => n + 1)} />
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <DocumentationPage />
        )}
      </AppShell>

      {/* Panel de configuración */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}

export default App