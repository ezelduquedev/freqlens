import { AdaptiveEQManager } from './AdaptiveEQManager'

// Importamos la URL del procesador de forma que Vite lo trate como un archivo estático
// NOTA: Asegúrate de que el archivo se llame 'yin-processor.js' y esté en la misma carpeta
const yinProcessorUrl = new URL('./yin-processor.js', import.meta.url)

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
    this.dispose()

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

      // Cargamos el módulo usando la URL procesada por Vite
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
      
      // Cadena: Source -> YinProcessor
      this.source.connect(this.yinNode)
      
      // Cadena: Source -> EQ -> Analyser
      const eqManager = AdaptiveEQManager.getInstance()
      eqManager.connect(this.source, this.analyser)
      
      // Nodo silencioso para mantener el grafo activo
      const silentGain = this.context.createGain()
      silentGain.gain.value = 0
      this.analyser.connect(silentGain)
      silentGain.connect(this.context.destination)
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