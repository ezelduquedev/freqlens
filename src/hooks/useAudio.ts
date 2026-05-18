import { useState, useRef, useCallback } from 'react'

export type AudioStatus = 'idle' | 'active' | 'error'

export interface AudioState {
  status: AudioStatus
  analyser: AnalyserNode | null
  audioContext: AudioContext | null
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

export function useAudio(fftSize: number = 2048): AudioState {
  const [status, setStatus] = useState<AudioStatus>('idle')
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [error, setError] = useState<string | null>(null)

  const streamRef       = useRef<MediaStream | null>(null)

  const start = useCallback(async () => {
    try {
      // Pedir acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      })

      // Crear el contexto de audio
      const newAudioContext = new AudioContext()

      // Crear el analizador FFT
      const newAnalyser = newAudioContext.createAnalyser()
      newAnalyser.fftSize = fftSize
      newAnalyser.smoothingTimeConstant = 0.8
      newAnalyser.minDecibels = -90
      newAnalyser.maxDecibels = -10

      // Conectar: micrófono → analizador
      const source = newAudioContext.createMediaStreamSource(stream)
      source.connect(newAnalyser)

      // Guardar referencias
      streamRef.current = stream
      setAnalyser(newAnalyser)
      setAudioContext(newAudioContext)
      setStatus('active')
      setError(null)
    } catch {
      setStatus('error')
      setError('No se pudo acceder al micrófono')
    }
  }, [fftSize])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioContext?.close()
    setAnalyser(null)
    setAudioContext(null)
    streamRef.current = null
    setStatus('idle')
  }, [audioContext])

  return {
    status,
    analyser,
    audioContext,
    error,
    start,
    stop,
  }
}