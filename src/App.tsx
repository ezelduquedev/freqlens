import { useState, useEffect } from 'react'
import { AudioManager } from './core/audio/AudioManager'
import { AdaptiveEQManager } from './core/audio/AdaptiveEQManager'
import { ProfessionalTuner } from './features/tuner/ProfessionalTuner'
import { EQVisualizer } from './features/eq/EQVisualizer'
import { EQPresets } from './features/eq/EQPresets'
import { EQCalibration } from './features/calibrate/EQCalibration'

// New modular layouts & features
import { AppShell } from './layouts/AppShell'
import { type TabId } from './layouts/Sidebar'
import { LandingPage } from './features/dashboard/LandingPage'
import { DashboardPage } from './features/dashboard/DashboardPage'

// Optional UI components for workspace placeholders
import { GlassPanel } from './ui/GlassPanel'
import { SectionTitle } from './ui/SectionTitle'
import { Stat } from './ui/Stat'
import { Activity } from 'lucide-react'

type Page = 'landing' | 'app'

function App() {
  const [page, setPage] = useState<Page>('landing')
  const [activeTab, setActiveTab] = useState<TabId>('analyzer')
  const [error, setError] = useState<string | null>(null)
  const [eqUpdateKey, setEqUpdateKey] = useState(0)
  const [engineRunning, setEngineRunning] = useState(false)

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
    return <LandingPage onStart={handleStart} error={error} />
  }

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      engineRunning={engineRunning}
      toggleEngine={handleToggleEngine}
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
            <GlassPanel className="h-full flex flex-col justify-between" hoverEffect>
              <div>
                <SectionTitle
                  title="Estado del Afinador Cromático"
                  subtitle="Detalles del tono de señal de entrada"
                  icon={<Activity className="w-4 h-4 text-accent" />}
                  activeIndicator={engineRunning}
                />
                <p className="text-xs text-text-soft leading-relaxed mt-2">
                  Afinador cromático de alta resolución basado en el algoritmo de detección de tono YIN. Mide la frecuencia fundamental en Hz y calcula la desviación exacta en centésimas de semitono (Cents).
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 mt-6">
                <Stat label="Algoritmo DSP" value="YIN Autocorrelation" sub="MULTI-HILO a 60FPS" />
                <Stat label="Rango de Entrada" value="20Hz - 2.5kHz" sub="MIC / LÍNEA" />
                <Stat label="Precisión Teórica" value="< 1 Cents" accent sub="CALIDAD DE ESTUDIO" />
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {activeTab === 'calibrate' && (
        <EQCalibration onNavigateToEQ={() => setActiveTab('eq')} />
      )}

      {activeTab === 'eq' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch min-h-0 flex-grow">
          {/* Left Side: Widescreen EQ Visualizer */}
          <div className="lg:col-span-3 h-[320px] lg:h-[450px] relative">
            <EQVisualizer key={eqUpdateKey} />
          </div>
          
          {/* Right Side: Vertical scrollable Presets & Calibrated spaces list */}
          <div className="lg:col-span-1 h-[320px] lg:h-[450px] min-h-0 flex flex-col">
            <EQPresets onPresetApply={() => setEqUpdateKey((n) => n + 1)} />
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default App