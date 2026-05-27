import type { ReactNode } from 'react'
import { Sidebar, type TabId } from './Sidebar'
import { Topbar } from './Topbar'
import { Workspace } from './Workspace'

interface AppShellProps {
  children: ReactNode
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  engineRunning: boolean
  toggleEngine: () => void
  onSettingsClick: () => void
}

export function AppShell({
  children,
  activeTab,
  setActiveTab,
  engineRunning,
  toggleEngine,
  onSettingsClick,
}: AppShellProps) {
  const tabLabels: Record<TabId, string> = {
    analyzer: 'Analizador Espectral',
    calibrate: 'Calibración de Sala',
    tuner: 'Afinador Cromático',
    eq: 'Ecualizador',
    docs: 'Documentación TFG'
  }

  return (
    <div className="min-h-screen bg-bg text-text overflow-hidden relative flex">
      {/* Dynamic Background Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/4 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-1/4 h-[600px] w-[600px] rounded-full bg-accent/3 blur-[140px]" />
      </div>

      {/* Main Structural Flex Wrapper */}
      <div className="flex w-full min-h-screen relative z-10">
        {/* Sidebar / Mobile Bottom Nav */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          engineRunning={engineRunning}
          toggleEngine={toggleEngine}
        />

        {/* Content Shell */}
        <div className="flex-1 min-h-screen flex flex-col overflow-hidden">
          {/* Topbar */}
          <Topbar
            engineRunning={engineRunning}
            toggleEngine={toggleEngine}
            activeTabLabel={tabLabels[activeTab]}
            onSettingsClick={onSettingsClick}
          />

          {/* Workspace — extra padding-bottom on mobile so content clears the bottom nav */}
          <Workspace>{children}</Workspace>
        </div>
      </div>
    </div>
  )
}
