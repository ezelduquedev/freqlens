import { AdaptiveEQManager } from './AdaptiveEQManager'
import yinProcessorUrl from './yin-processor.ts?url'
export type AudioEngineStatus = 'suspended' | 'running' | 'closed'

export class AudioManager {
  private static instance: AudioManager
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null
  private yinNode: AudioWorkletNode | null = null
  private onPitchCallback: ((pitch: number) => void) | null = null

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  public async initialize(): Promise<void> {
    if (this.context) return

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      })

      this.context = new AudioContext({
        latencyHint: 'interactive',
        sampleRate: 48000,
      })

      // Cargar Worklet de Pitch (YIN)
      // Usando ?worker&url para compatibilidad con Vite 8
      await this.context.audioWorklet.addModule(yinProcessorUrl)
      
      this.yinNode = new AudioWorkletNode(this.context, 'yin-processor')
      this.yinNode.port.onmessage = (event) => {
        if (event.data.type === 'PITCH_DETECTED' && this.onPitchCallback) {
          this.onPitchCallback(event.data.pitch)
        }
      }

      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 4096
      
      this.source = this.context.createMediaStreamSource(this.stream)
      
      // Cadena: Source -> EQ -> Analyser
      // Y también: Source -> YinProcessor
      this.source.connect(this.yinNode)
      
      const eqManager = AdaptiveEQManager.getInstance()
      eqManager.connect(this.source, this.analyser)
      
      // El analizador NO se conecta al destination (para evitar feedback si hay altavoces cerca)
      // a menos que sea necesario para monitoreo.
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error)
      throw error
    }
  }

  public setOnPitchListener(callback: (pitch: number) => void) {
    this.onPitchCallback = callback
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  public getContext(): AudioContext | null {
    return this.context
  }

  public getStream(): MediaStream | null {
    return this.stream
  }

  public getSource(): MediaStreamAudioSourceNode | null {
    return this.source
  }

  public async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume()
    }
  }

  public async suspend(): Promise<void> {
    if (this.context?.state === 'running') {
      await this.context.suspend()
    }
  }

  public dispose(): void {
    AdaptiveEQManager.getInstance().disconnect()
    this.stream?.getTracks().forEach(track => track.stop())
    this.context?.close()
    this.context = null
    this.analyser = null
    this.source = null
    this.stream = null
  }
}
