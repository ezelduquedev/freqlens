type Tab = 'spectrum' | 'tuner'

interface TabsProps {
  active: Tab
  onChange: (tab: Tab) => void
}

function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-white/10 px-6 gap-8 flex-shrink-0">
      <button
        onClick={() => onChange('spectrum')}
        className={`py-4 font-mono text-sm tracking-widest border-b-2 transition-all ${
          active === 'spectrum'
            ? 'text-orange-400 border-orange-400'
            : 'text-white/30 border-transparent hover:text-white/60'
        }`}
      >
        ESPECTRO
      </button>
      <button
        onClick={() => onChange('tuner')}
        className={`py-4 font-mono text-sm tracking-widest border-b-2 transition-all ${
          active === 'tuner'
            ? 'text-yellow-400 border-yellow-400'
            : 'text-white/30 border-transparent hover:text-white/60'
        }`}
      >
        AFINADOR
      </button>
    </div>
  )
}

export default Tabs