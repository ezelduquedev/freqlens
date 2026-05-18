export interface NoteInfo {
  note: string
  octave: number
  cents: number
  frequency: number
}

export class PitchService {
  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  public static getNoteFromFrequency(frequency: number): NoteInfo | null {
    if (frequency <= 0) return null

    // A4 = 440Hz
    const h = Math.round(12 * Math.log2(frequency / 440)) + 69
    const cents = Math.floor(1200 * Math.log2(frequency / this.getFrequencyFromNote(h)))
    
    const noteIndex = h % 12
    const octave = Math.floor(h / 12) - 1
    const noteName = this.NOTE_NAMES[noteIndex]

    return {
      note: noteName,
      octave: octave,
      cents: cents,
      frequency: frequency
    }
  }

  private static getFrequencyFromNote(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12)
  }
}
