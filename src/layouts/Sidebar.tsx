import clsx from 'clsx'
import {
  LayoutDashboard,
  Mic,
  Music,
  Sliders,
  Power
} from 'lucide-react'

export type TabId = 'analyzer' | 'calibrate' | 'tuner' | 'eq'

interface SidebarProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  engineRunning: boolean
  toggleEngine: () => void
}

export function Sidebar({
  activeTab,
  setActiveTab,
  engineRunning,
  toggleEngine
}: SidebarProps) {
  const menuItems = [
    { id: 'analyzer', label: 'Consola', icon: LayoutDashboard },
    { id: 'calibrate', label: 'Calibrar', icon: Mic },
    { id: 'tuner', label: 'Afinador', icon: Music },
    { id: 'eq', label: 'EQ', icon: Sliders }
  ] as const

  return (
    <aside className="w-[88px] min-h-screen flex-shrink-0 bg-black/20 border-r border-white/5 backdrop-blur-xl flex flex-col items-center py-6 justify-between select-none">
      {/* Brand logo */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-9 h-9 rounded-[14px] bg-accent/10 border border-accent/30 flex items-center justify-center font-bold text-accent shadow-[0_0_15px_rgba(255,140,0,0.15)] animate-pulse">
          FL
        </div>
        <span className="mono text-[8px] uppercase tracking-widest text-text-muted mt-2">
          v2.0
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex flex-col gap-3 w-full px-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'group w-full flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl cursor-pointer relative transition-all duration-200 active:scale-95',
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-soft border border-transparent hover:text-text hover:bg-white/[0.04]'
              )}
            >
              {/* Active Indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-[25%] bottom-[25%] w-0.75 bg-accent rounded-r-full shadow-[0_0_8px_var(--accent)]" />
              )}
              
              <IconComponent
                className={clsx(
                  'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-accent' : 'text-text-soft group-hover:text-text'
                )}
              />
              <span
                className={clsx(
                  'mono text-[9px] uppercase tracking-tighter transition-all font-semibold',
                  isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-soft'
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Engine Power Button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={toggleEngine}
          title={engineRunning ? 'Detener motor de audio' : 'Iniciar motor de audio'}
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 border active:scale-90',
            engineRunning
              ? 'bg-danger/10 border-danger/30 text-danger shadow-[0_0_12px_rgba(255,69,58,0.2)]'
              : 'bg-white/[0.03] border-white/5 text-text-soft hover:bg-white/[0.08] hover:text-text'
          )}
        >
          <Power className="w-4 h-4" />
        </button>
        <span
          className={clsx(
            'mono text-[8px] uppercase tracking-widest font-black',
            engineRunning ? 'text-danger' : 'text-text-muted'
          )}
        >
          {engineRunning ? 'ON' : 'OFF'}
        </span>
      </div>
    </aside>
  )
}
