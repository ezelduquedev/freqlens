/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * YinProcessor - Real-time pitch detection using YIN algorithm
 * Runs in the AudioWorklet thread.
 */

// Declaraciones para evitar errores de TypeScript en el scope del Worklet
declare class AudioWorkletProcessor {
  readonly port: MessagePort
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean
}

declare function registerProcessor(name: string, processorClass: any): void
declare const sampleRate: number

class YinProcessor extends AudioWorkletProcessor {
  private bufferSize: number = 2048
  private buffer: Float32Array = new Float32Array(2048)
  private pos: number = 0
  private threshold: number = 0.15

  constructor() {
    super()
  }

  process(inputs: Float32Array[][], _outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0][0]
    if (!input) return true

    for (let i = 0; i < input.length; i++) {
      this.buffer[this.pos] = input[i]
      this.pos++

      if (this.pos >= this.bufferSize) {
        const pitch = this.detectPitch(this.buffer)
        if (pitch > 0) {
          this.port.postMessage({ type: 'PITCH_DETECTED', pitch })
        }
        this.pos = 0
      }
    }

    return true
  }

  private detectPitch(buffer: Float32Array): number {
    const tauMax = Math.floor(buffer.length / 2)
    const diffs = new Float32Array(tauMax)
    
    // 1. Difference Function
    for (let tau = 0; tau < tauMax; tau++) {
      for (let j = 0; j < tauMax; j++) {
        const tmp = buffer[j] - buffer[j + tau]
        diffs[tau] += tmp * tmp
      }
    }

    // 2. Cumulative Mean Normalized Difference
    const cmndf = new Float32Array(tauMax)
    cmndf[0] = 1
    let runningSum = 0
    for (let tau = 1; tau < tauMax; tau++) {
      runningSum += diffs[tau]
      cmndf[tau] = diffs[tau] / ((1 / tau) * runningSum)
    }

    // 3. Absolute Threshold & Local Minimum
    let tau = -1
    for (let t = 2; t < tauMax; t++) {
      if (cmndf[t] < this.threshold) {
        while (t + 1 < tauMax && cmndf[t + 1] < cmndf[t]) {
          t++
        }
        tau = t
        break
      }
    }

    if (tau === -1) return -1

    // 4. Parabolic Interpolation
    const alpha = cmndf[tau - 1]
    const beta = cmndf[tau]
    const gamma = cmndf[tau + 1]
    const betterTau = tau + (gamma - alpha) / (2 * (2 * beta - gamma - alpha))

    return sampleRate / betterTau
  }
}

registerProcessor('yin-processor', YinProcessor)
