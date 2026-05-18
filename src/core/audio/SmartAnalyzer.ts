/**
 * SmartAnalyzer - Real-time audio intelligence
 * Analyzes frequency distributions to provide engineering feedback.
 */

export interface AudioFeedback {
  type: 'warning' | 'info' | 'success'
  message: string
  frequencyRange?: [number, number]
}

export class SmartAnalyzer {
  /**
   * Analiza el balance tonal y detecta problemas comunes
   */
  public static analyzeTonalBalance(fftData: Float32Array, sampleRate: number): AudioFeedback[] {
    const feedback: AudioFeedback[] = []
    
    // 1. Detectar exceso de graves (Muddy / Boomy)
    // Rango 100-250Hz
    const lowMidEnergy = this.getEnergyInRange(fftData, 100, 250, sampleRate)
    if (lowMidEnergy > -20) {
      feedback.push({
        type: 'warning',
        message: 'Exceso de energía en 125-250Hz. Considera un "low cut" para reducir turbidez.',
        frequencyRange: [100, 250]
      })
    }

    // 2. Detectar sibilancia o "Harshness"
    // Rango 3kHz - 7kHz
    const highMidEnergy = this.getEnergyInRange(fftData, 3000, 7000, sampleRate)
    if (highMidEnergy > -25) {
      feedback.push({
        type: 'info',
        message: 'Presencia alta en medios-agudos. Puede sonar hiriente en volúmenes altos.',
        frequencyRange: [3000, 7000]
      })
    }

    return feedback
  }

  private static getEnergyInRange(
    fftData: Float32Array, 
    fStart: number, 
    fEnd: number, 
    sampleRate: number
  ): number {
    const binSize = sampleRate / (fftData.length * 2)
    const startIndex = Math.floor(fStart / binSize)
    const endIndex = Math.floor(fEnd / binSize)
    
    let sum = 0
    let count = 0
    for (let i = startIndex; i <= endIndex && i < fftData.length; i++) {
      sum += fftData[i]
      count++
    }
    
    return count > 0 ? sum / count : -100
  }
}
