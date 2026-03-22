// Convierte un índice de bin FFT a su frecuencia en Hz
export function binToFreq(
  binIndex: number,
  fftSize: number,
  sampleRate: number
): number {
  return (binIndex * sampleRate) / fftSize
}

// Convierte una frecuencia Hz a su posición X en pantalla (escala logarítmica)
export function freqToX(
  freq: number,
  minFreq: number,
  maxFreq: number,
  width: number
): number {
  if (freq <= 0) return 0
  const logMin = Math.log10(minFreq)
  const logMax = Math.log10(maxFreq)
  const logF   = Math.log10(freq)
  return ((logF - logMin) / (logMax - logMin)) * width
}

// Convierte un valor en dB a posición Y en el canvas
export function dbToY(
  db: number,
  minDb: number,
  maxDb: number,
  height: number
): number {
  const norm = (db - minDb) / (maxDb - minDb)
  return height - Math.max(0, Math.min(1, norm)) * height
}

// Calcula el RMS (volumen general) de la señal
export function calcRMS(timeData: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < timeData.length; i++) {
    const v = (timeData[i] / 128) - 1
    sum += v * v
  }
  return Math.sqrt(sum / timeData.length)
}

// Formatea una frecuencia para mostrarla
export function formatFreq(hz: number): string {
  if (hz >= 1000) return (hz / 1000).toFixed(1) + ' kHz'
  return hz.toFixed(0) + ' Hz'
}