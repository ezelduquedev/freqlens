type Tab = 'spectrum' | 'tuner'

interface TabsProps {
  active: Tab
  onChange: (tab: Tab) => void
}

function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="flex justify-center border-b border-gray-100 gap-16 flex-shrink-0">
      {(['spectrum', 'tuner'] as Tab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            fontFamily: 'DM Mono',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            padding: '14px 0',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: active === tab ? '2px solid #f97316' : '2px solid transparent',
            color: active === tab ? '#f97316' : '#9ca3af',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {tab === 'spectrum' ? 'ESPECTRO' : 'AFINADOR'}
        </button>
      ))}
    </div>
  )
}

export default Tabs