interface StartScreenProps {
  onStart: () => void
  error: string | null
}

function StartScreen({ onStart, error }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 p-8">

      {/* Icono animado */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute w-full h-full rounded-full border-2 border-orange-400 animate-ping opacity-30" />
        <div className="absolute w-full h-full rounded-full border-2 border-orange-400 opacity-60" />
        <svg className="w-10 h-10 fill-orange-400" viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zM7 11a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.93V20h2v2H9v-2h2v-2.07A7 7 0 0 1 5 11H7z"/>
        </svg>
      </div>

      {/* Texto */}
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-wide">
          Analizador Espectral
        </h2>
        <p className="font-mono text-sm text-white/40 max-w-xs leading-relaxed">
          Requiere acceso al micrófono para capturar audio en tiempo real
        </p>
      </div>

      {/* Error si lo hay */}
      {error && (
        <p className="font-mono text-xs text-red-400 bg-red-400/10 px-4 py-2 rounded">
          {error}
        </p>
      )}

      {/* Botón */}
      <button
        onClick={onStart}
        className="font-mono text-sm tracking-widest px-10 py-4 bg-orange-400 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
      >
        INICIAR MICRÓFONO
      </button>

    </div>
  )
}

export default StartScreen