function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-baseline gap-3">
        <span style={{ fontFamily: 'DM Mono', fontWeight: 500, fontSize: '1.25rem', letterSpacing: '0.15em', color: '#1a1a1a' }}>
          FREQ<span style={{ color: '#f97316' }}>LENS</span>
        </span>
        <span style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', color: '#9ca3af', letterSpacing: '0.1em' }}>
          v1.0
        </span>
      </div>
    </header>
  )
}

export default Header