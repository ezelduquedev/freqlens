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
  const [error, setError] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef     = useRef<AnalyserNode | null>(null)
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
      const audioContext = new AudioContext()

      // Crear el analizador FFT
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = fftSize
      analyser.smoothingTimeConstant = 0.8
      analyser.minDecibels = -90
      analyser.maxDecibels = -10

      // Conectar: micrófono → analizador
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Guardar referencias
      audioContextRef.current = audioContext
      analyserRef.current     = analyser
      streamRef.current       = stream

      setStatus('active')
      setError(null)
    } catch (e) {
      setStatus('error')
      setError('No se pudo acceder al micrófono')
    }
  }, [fftSize])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current     = null
    streamRef.current       = null
    setStatus('idle')
  }, [])

  return {
    status,
    analyser: analyserRef.current,
    audioContext: audioContextRef.current,
    error,
    start,
    stop,
  }
}