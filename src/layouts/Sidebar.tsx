import clsx from 'clsx'
import {
  LayoutDashboard,
  Mic,
  Music,
  Sliders,
  Power,
  BookOpen
} from 'lucide-react'

export type TabId = 'analyzer' | 'calibrate' | 'tuner' | 'eq' | 'docs'

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
    { id: 'analyzer', label: 'CONSOLA', icon: LayoutDashboard },
    { id: 'calibrate', label: 'CALIBRAR', icon: Mic },
    { id: 'tuner', label: 'AFINADOR', icon: Music },
    { id: 'eq', label: 'EQ', icon: Sliders },
    { id: 'docs', label: 'TFG DOC', icon: BookOpen }
  ] as const

  return (
    <aside className="w-[88px] min-h-screen flex-shrink-0 bg-panel/30 border-r border-border-custom backdrop-blur-xl flex flex-col items-center py-6 justify-between select-none">
      {/* Brand logo (New official geometric design) */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-10 flex items-center justify-center animate-pulse drop-shadow-[0_0_10px_var(--accent-glow)] select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="40" stroke="var(--accent)" strokeWidth="6" fill="none" />
            <path d="M 22 62 Q 35 62 42 45 Q 50 25 58 45 Q 65 62 78 62" stroke="var(--text)" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="48" r="5" fill="var(--text)" />
          </svg>
        </div>
        <span className="mono text-[8px] uppercase tracking-widest text-text-muted mt-2 font-black">
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
                  ? 'bg-accent text-white shadow-[0_4px_12px_rgba(255,140,0,0.25)] border border-accent'
                  : 'text-text-soft border border-transparent hover:text-text hover:bg-black/5 dark:hover:bg-white/[0.04]'
              )}
            >
              <IconComponent
                className={clsx(
                  'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-white' : 'text-text-soft group-hover:text-text'
                )}
              />
              <span
                className={clsx(
                  'mono text-[9px] uppercase tracking-tighter transition-all font-semibold',
                  isActive ? 'text-white' : 'text-text-muted group-hover:text-text-soft'
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Bottom Controls (Theme + Engine) */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Theme Toggle Button */}
        <div className="flex flex-col items-center gap-1.5 select-none">

        </div>

        {/* Engine Power Button */}
        <div className="flex flex-col items-center gap-1.5">
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
              'mono text-[7px] uppercase tracking-widest font-black leading-none',
              engineRunning ? 'text-danger' : 'text-text-muted'
            )}
          >
            {engineRunning ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </aside>
  )
}
