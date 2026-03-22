import { useState } from 'react'
import Header from './components/Layout/Header'
import Tabs from './components/Layout/Tabs'
import StartScreen from './components/Layout/StartScreen'
import SpectrumAnalyzer from './components/SpectrumAnalyzer/SpectrumAnalyzer'
import Tuner from './components/Tuner/Tuner'
import { useAudio } from './hooks/useAudio'

type Tab = 'spectrum' | 'tuner'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('spectrum')
  const audio = useAudio(4096)

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      <Header />

      {audio.status !== 'active' ? (
        <StartScreen
          onStart={audio.start}
          error={audio.error}
        />
      ) : (
        <>
          <Tabs active={activeTab} onChange={setActiveTab} />
          <main className="flex-1 p-4 min-h-0">
            {activeTab === 'spectrum' && (
              <SpectrumAnalyzer
                analyser={audio.analyser!}
                audioContext={audio.audioContext!}
              />
            )}
            {activeTab === 'tuner' && (
              <Tuner
                analyser={audio.analyser!}
                audioContext={audio.audioContext!}
              />
            )}
          </main>
        </>
      )}
    </div>
  )
}

export default App