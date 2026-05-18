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

// Detecta si una zona de frecuencia problemática está activa en el audio actual
export function isProblematicFreqActive(
  freqData: Float32Array,
  freqRange: ProblematicFreqRange,
  fftSize: number,
  sampleRate: number,
  threshold: number = -50 // dB threshold
): boolean {
  const binSize = sampleRate / fftSize
  
  // Convertir rango de frecuencias a índices de bins
  const minBin = Math.floor(freqRange.min / binSize)
  const maxBin = Math.ceil(freqRange.max / binSize)
  
  // Calcular el promedio de dB en ese rango
  let sum = 0
  let count = 0
  
  for (let i = minBin; i < maxBin && i < freqData.length; i++) {
    if (i >= 0) {
      sum += freqData[i]
      count++
    }
  }
  
  const avgDb = count > 0 ? sum / count : -Infinity
  
  // La zona está activa si el promedio supera el umbral
  return avgDb > threshold
}

// Define rangos de frecuencias molestas/problemáticas
export interface ProblematicFreqRange {
  label: string
  freq: number // frecuencia central
  min: number
  max: number
  description: string
}

export const PROBLEMATIC_FREQUENCIES: ProblematicFreqRange[] = [
  {
    label: 'Boom',
    freq: 80,
    min: 60,
    max: 100,
    description: 'Baja frecuencia ofensiva'
  },
  {
    label: 'Nasal',
    freq: 250,
    min: 200,
    max: 300,
    description: 'Frecuencia nasal'
  },
  {
    label: 'Presencia Baja',
    freq: 1000,
    min: 800,
    max: 1200,
    description: 'Presencia baja ofensiva'
  },
  {
    label: 'Pico Duro',
    freq: 3000,
    min: 2500,
    max: 3500,
    description: 'Pico duro, sibilancia'
  },
  {
    label: 'Brillo Excesivo',
    freq: 5000,
    min: 4000,
    max: 6000,
    description: 'Brillo excesivo'
  },
  {
    label: 'Chillido',
    freq: 8000,
    min: 7000,
    max: 9000,
    description: 'Frecuencia de chillido'
  }
]