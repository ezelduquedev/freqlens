const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

export interface NoteResult {
  note: string
  octave: number
  cents: number
  isSharp: boolean
}

export function freqToNote(freq: number, a4: number = 440): NoteResult {
  const semiFromA4 = 12 * Math.log2(freq / a4)
  const semiRound  = Math.round(semiFromA4)
  const cents      = Math.round((semiFromA4 - semiRound) * 100)
  const midiNote   = 69 + semiRound
  const octave     = Math.floor(midiNote / 12) - 1
  const note       = NOTE_NAMES[((midiNote % 12) + 12) % 12]
  const isSharp    = note.includes('#')
  return { note, octave, cents, isSharp }
}

export function yinPitch(buffer: Float32Array, sampleRate: number): number {
  const W         = Math.floor(buffer.length / 2)
  const threshold = 0.1
  const d         = new Float32Array(W)

  for (let tau = 1; tau < W; tau++) {
    let sum = 0
    for (let i = 0; i < W; i++) {
      const diff = buffer[i] - buffer[i + tau]
      sum += diff * diff
    }
    d[tau] = sum
  }

  const cmnd = new Float32Array(W)
  cmnd[0] = 1
  let runSum = 0
  for (let tau = 1; tau < W; tau++) {
    runSum   += d[tau]
    cmnd[tau] = runSum === 0 ? 0 : (d[tau] * tau) / runSum
  }

  let tau = 2
  while (tau < W) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 < W && cmnd[tau + 1] < cmnd[tau]) tau++
      break
    }
    tau++
  }

  if (tau === W || cmnd[tau] >= 0.5) return -1

  const x0 = tau > 1 ? tau - 1 : tau
  const x2 = tau + 1 < W ? tau + 1 : tau
  let betterTau: number

  if (x0 === tau) {
    betterTau = cmnd[tau] <= cmnd[x2] ? tau : x2
  } else if (x2 === tau) {
    betterTau = cmnd[tau] <= cmnd[x0] ? tau : x0
  } else {
    const s0 = cmnd[x0], s1 = cmnd[tau], s2 = cmnd[x2]
    betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0))
  }

  return sampleRate / betterTau
}