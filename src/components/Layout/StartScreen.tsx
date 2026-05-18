interface StartScreenProps {
  onStart: () => void
  error: string | null
}

function StartScreen({ onStart, error }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-10 p-8">

      {/* Icono */}
      <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '1px solid #f97316', opacity: 0.3,
          animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite'
        }} />
        <div style={{ width: 72, height: 72, borderRadius: '50%', border: '1px solid #f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#f97316">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zM7 11a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.93V20h2v2H9v-2h2v-2.07A7 7 0 0 1 5 11H7z"/>
          </svg>
        </div>
      </div>

      {/* Texto */}
      <div className="text-center flex flex-col gap-3">
        <h2 style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          Analizador Espectral<br />en Tiempo Real
        </h2>
        <p style={{ fontFamily: 'DM Mono', fontSize: '0.75rem', color: '#9ca3af', maxWidth: 280, lineHeight: 1.8, letterSpacing: '0.02em' }}>
          Requiere acceso al micrófono del dispositivo para capturar audio
        </p>
      </div>

      {error && (
        <p style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: '#ef4444', background: '#fef2f2', padding: '8px 16px', borderRadius: 4, letterSpacing: '0.05em' }}>
          {error}
        </p>
      )}

      <button
        onClick={onStart}
        style={{
          fontFamily: 'DM Mono', fontWeight: 500, fontSize: '0.75rem',
          letterSpacing: '0.2em', padding: '14px 40px',
          background: '#f97316', color: '#ffffff',
          border: 'none', borderRadius: 2, cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#ea580c')}
        onMouseLeave={e => (e.currentTarget.style.background = '#f97316')}
      >
        INICIAR MICRÓFONO
      </button>

    </div>
  )
}

export default StartScreen