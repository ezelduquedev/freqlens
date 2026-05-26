import { AdaptiveEQManager } from './AdaptiveEQManager'

const yinProcessorUrl = new URL('./yin-processor.js', import.meta.url).href

function _loadAudioSettings(): { fftSize: number; smoothingTimeConstant: number } {
  try {
    const raw = localStorage.getItem('freqlens_settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        fftSize: parsed.fftSize ?? 4096,
        smoothingTimeConstant: parsed.smoothingTimeConstant ?? 0.80,
      }
    }
  } catch { /* ignore */ }
  return { fftSize: 4096, smoothingTimeConstant: 0.80 }
}

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

  public updateAnalyserSettings(fftSize: number, smoothing: number) {
    if (this.analyser) {
      this.analyser.fftSize = fftSize;
      this.analyser.smoothingTimeConstant = smoothing;
    }
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

      await this.context.audioWorklet.addModule(yinProcessorUrl)
      
      this.yinNode = new AudioWorkletNode(this.context, 'yin-processor')
      this.yinNode.port.onmessage = (event) => {
        if (event.data.type === 'PITCH_DETECTED' && this.onPitchCallback) {
          this.onPitchCallback(event.data.pitch)
        }
      }

      this.analyser = this.context.createAnalyser()
      const audioSettings = _loadAudioSettings()
      this.analyser.fftSize = audioSettings.fftSize
      this.analyser.smoothingTimeConstant = audioSettings.smoothingTimeConstant
      
      this.source = this.context.createMediaStreamSource(this.stream)
      this.source.connect(this.yinNode)
      
      const eqManager = AdaptiveEQManager.getInstance()
      eqManager.connect(this.source, this.analyser)
      
      const silentGain = this.context.createGain()
      silentGain.gain.value = 0
      this.analyser.connect(silentGain)
      silentGain.connect(this.context.destination)
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error)
      throw error
    }
  }

  public setOnPitchListener(callback: (pitch: number) => void) { this.onPitchCallback = callback }
  public getAnalyser(): AnalyserNode | null { return this.analyser }
  public getContext(): AudioContext | null { return this.context }
  public getStream(): MediaStream | null { return this.stream }
  public getSource(): MediaStreamAudioSourceNode | null { return this.source }
  public async resume(): Promise<void> { if (this.context?.state === 'suspended') await this.context.resume() }
  public async suspend(): Promise<void> { if (this.context?.state === 'running') await this.context.suspend() }
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