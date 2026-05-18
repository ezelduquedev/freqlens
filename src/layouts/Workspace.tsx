import React from 'react'

interface WorkspaceProps {
  children: React.ReactNode
}

export function Workspace({ children }: WorkspaceProps) {
  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-5 no-scrollbar bg-gradient-to-b from-bg to-[#07080b]">
      <div className="max-w-[1440px] mx-auto h-full flex flex-col gap-4 fade-in">
        {children}
      </div>
    </main>
  )
}
