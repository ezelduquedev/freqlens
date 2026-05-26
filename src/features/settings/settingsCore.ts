// src/features/settings/settingsCore.ts
export interface FreqLensSettings {
  fftSize: 1024 | 2048 | 4096 | 8192
  smoothingTimeConstant: number
  referenceA4: number
  peakHoldDecay: number
  yinThreshold: number
  displayFps: boolean
  displayFftInfo: boolean
}

export const DEFAULT_SETTINGS: FreqLensSettings = {
  fftSize: 4096,
  smoothingTimeConstant: 0.80,
  referenceA4: 440,
  peakHoldDecay: 1500,
  yinThreshold: 0.10,
  displayFps: true,
  displayFftInfo: true,
}

const STORAGE_KEY = 'freqlens_settings'

export function loadSettings(): FreqLensSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function persistSettings(s: FreqLensSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}