import { AudioManager } from '../audio/AudioManager'

export class CalibrationService {
  private static instance: CalibrationService
  private isCalibrating: boolean = false

  private constructor() {}

  public static getInstance(): CalibrationService {
    if (!CalibrationService.instance) {
      CalibrationService.instance = new CalibrationService()
    }
    return CalibrationService.instance
  }

  /**
   * Genera un Logarithmic Sine Sweep
   * f(t) = f1 * (f2/f1)^(t/T)
   */
  public async runSineSweep(duration: number = 10): Promise<Float32Array> {
    const audioManager = AudioManager.getInstance()
    const ctx = audioManager.getContext()
    if (!ctx) throw new Error('AudioContext not initialized')

    const f1 = 20 // Start frequency
    const f2 = 20000 // End frequency
    const sampleRate = ctx.sampleRate
    const totalSamples = duration * sampleRate
    
    const sweepBuffer = ctx.createBuffer(1, totalSamples, sampleRate)
    const data = sweepBuffer.getChannelData(0)

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples
      const phase = 2 * Math.PI * f1 * duration * (Math.pow(f2 / f1, t) - 1) / Math.log(f2 / f1)
      data[i] = Math.sin(phase)
    }

    return this.captureResponse(sweepBuffer, duration)
  }

  /**
   * Genera ruido rosa usando el algoritmo Voss-McCartney
   */
  public async runPinkNoise(duration: number = 15): Promise<Float32Array> {
    const audioManager = AudioManager.getInstance()
    const ctx = audioManager.getContext()
    if (!ctx) throw new Error('AudioContext not initialized')

    const sampleRate = ctx.sampleRate
    const totalSamples = duration * sampleRate
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate)
    const data = buffer.getChannelData(0)

    // Algoritmo Voss-McCartney (7 generadores)
    const rows = 7
    const dice = new Float32Array(rows)
    let runningSum = 0

    for (let i = 0; i < rows; i++) {
      dice[i] = Math.random() * 2 - 1
      runningSum += dice[i]
    }

    for (let i = 0; i < totalSamples; i++) {
      let key = i
      let count = 0
      if (key > 0) {
        while ((key & 1) === 0) {
          key >>= 1
          count++
        }
      }
      
      if (count < rows) {
        runningSum -= dice[count]
        dice[count] = Math.random() * 2 - 1
        runningSum += dice[count]
      }

      data[i] = (runningSum + (Math.random() * 2 - 1)) / (rows + 1)
    }

    return this.captureResponse(buffer, duration)
  }

  private async captureResponse(buffer: AudioBuffer, duration: number): Promise<Float32Array> {
    const audioManager = AudioManager.getInstance()
    const ctx = audioManager.getContext()
    
    if (!ctx || !audioManager.getSource()) throw new Error('Audio context or source not available')

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 4096
    const sourceNode = audioManager.getSource()!
    sourceNode.connect(analyser)

    const bufferSource = ctx.createBufferSource()
    bufferSource.buffer = buffer
    bufferSource.connect(ctx.destination)

    const binCount = analyser.frequencyBinCount
    const accumulatedData = new Float32Array(binCount)
    let frameCount = 0
    
    return new Promise((resolve) => {
      bufferSource.start()
      this.isCalibrating = true

      const startTime = ctx.currentTime
      
      const captureFrame = () => {
        if (!this.isCalibrating) return

        const dataArray = new Float32Array(binCount)
        analyser.getFloatFrequencyData(dataArray)

        for (let i = 0; i < binCount; i++) {
          if (dataArray[i] !== -Infinity) {
            accumulatedData[i] += dataArray[i]
          }
        }
        frameCount++

        if (ctx.currentTime - startTime < duration) {
          requestAnimationFrame(captureFrame)
        } else {
          this.isCalibrating = false
          bufferSource.stop()
          sourceNode.disconnect(analyser)
          
          const averagedData = new Float32Array(binCount)
          for (let i = 0; i < binCount; i++) {
            averagedData[i] = accumulatedData[i] / (frameCount || 1)
          }
          resolve(averagedData)
        }
      }

      requestAnimationFrame(captureFrame)
    })
  }
}
