function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl tracking-widest text-orange-400">
          FreqLens
        </span>
        <span className="font-mono text-xs text-white/30 tracking-wider">
          v1.0 · TFG DAM
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-400" />
        <span className="font-mono text-xs text-white/40">ACTIVO</span>
      </div>
    </header>
  )
}

export default Header