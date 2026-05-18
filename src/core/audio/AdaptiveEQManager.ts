import { AudioManager } from './AudioManager'

export interface EQBand {
  id: string
  type: BiquadFilterType
  frequency: number
  gain: number
  Q: number
  node?: BiquadFilterNode
}

export class AdaptiveEQManager {
  private static instance: AdaptiveEQManager
  private bands: EQBand[] = []

  private isConnected: boolean = false

  private constructor() {
    this.initializeDefaultBands()
  }

  public static getInstance(): AdaptiveEQManager {
    if (!AdaptiveEQManager.instance) {
      AdaptiveEQManager.instance = new AdaptiveEQManager()
    }
    return AdaptiveEQManager.instance
  }

  private initializeDefaultBands() {
    this.bands = [
      { id: 'hpf', type: 'highpass', frequency: 20, gain: 0, Q: 0.707 },
      { id: 'low-shelf', type: 'lowshelf', frequency: 100, gain: 0, Q: 0.707 },
      { id: 'mid-1', type: 'peaking', frequency: 500, gain: 0, Q: 1.0 },
      { id: 'mid-2', type: 'peaking', frequency: 2000, gain: 0, Q: 1.0 },
      { id: 'high-shelf', type: 'highshelf', frequency: 8000, gain: 0, Q: 0.707 },
    ]
  }

  public connect(source: AudioNode, destination: AudioNode) {
    if (this.isConnected) return
    
    const audioManager = AudioManager.getInstance()
    const ctx = audioManager.getContext()
    if (!ctx) return

    this.isConnected = true
    let lastNode = source

    this.bands.forEach(band => {
      const node = ctx.createBiquadFilter()
      node.type = band.type
      node.frequency.value = band.frequency
      node.gain.value = band.gain
      node.Q.value = band.Q
      
      band.node = node
      lastNode.connect(node)
      lastNode = node
    })

    lastNode.connect(destination)
  }

  /**
   * Genera una curva de EQ inversa basada en la respuesta de frecuencia medida
   * para aplanar la respuesta de la sala.
   */
  public calculateCorrection(measuredResponse: number[], frequencies: number[]) {
    // 1. Identificar picos y valles significativos
    // 2. Aplicar filtros inversos con limitación (no subir más de 6dB para evitar distorsión)
    // 3. Suavizar la curva para evitar artefactos de fase
    
    this.bands.forEach(band => {
      const index = this.findClosestFrequencyIndex(frequencies, band.frequency)
      const error = measuredResponse[index] || 0
      
      // Target es 0dB. Si medimos -5dB, aplicamos +5dB (con límite)
      const correction = Math.max(-12, Math.min(6, -error))
      
      if (band.node) {
        band.node.gain.setTargetAtTime(correction, 0, 0.1)
      }
      band.gain = correction
    })
  }

  private findClosestFrequencyIndex(frequencies: number[], target: number): number {
    return frequencies.reduce((prev, curr, idx) => 
      Math.abs(curr - target) < Math.abs(frequencies[prev] - target) ? idx : prev
    , 0)
  }

  public setBandGain(id: string, gain: number) {
    const band = this.bands.find(b => b.id === id)
    if (band && band.node) {
      band.node.gain.setTargetAtTime(gain, 0, 0.05)
      band.gain = gain
    }
  }

  public getBands() {
    return this.bands
  }

  public disconnect() {
    this.bands.forEach(band => {
      try { band.node?.disconnect() } catch (err) { void err }
      band.node = undefined
    })
    this.isConnected = false
  }
}
