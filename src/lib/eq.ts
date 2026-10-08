export type FilterType = 'lowshelf' | 'peaking' | 'highshelf'

export type EqBand = { label: string; freq: number; type: FilterType; q: number }

export type EqPreset = { name: string; gains: number[] }

export const MAX_DB = 12

export const BANDS: EqBand[] = [
  { label: '60', freq: 60, type: 'lowshelf', q: 0.707 },
  { label: '230', freq: 230, type: 'peaking', q: 0.9 },
  { label: '910', freq: 910, type: 'peaking', q: 0.9 },
  { label: '3.6k', freq: 3600, type: 'peaking', q: 0.9 },
  { label: '14k', freq: 14000, type: 'highshelf', q: 0.707 },
]

export const PRESETS: EqPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass', gains: [6, 4, 0, 0, 0] },
  { name: 'Rock', gains: [5, 2, -2, 2, 5] },
  { name: 'Pop', gains: [-1, 2, 4, 2, -1] },
  { name: 'Jazz', gains: [3, 1, -1, 2, 3] },
  { name: 'Classical', gains: [4, 2, -1, 2, 4] },
  { name: 'Vocal', gains: [-2, -1, 3, 4, 1] },
  { name: 'Car', gains: [3, 0, -1, 2, 4] },
]

export type BiquadCoeffs = { b0: number; b1: number; b2: number; a1: number; a2: number }

/** RBJ Audio EQ Cookbook coefficients, a0 folded in. Matches the phone equalizer curve. */
export function design(type: FilterType, freq: number, gainDb: number, q: number, fs: number): BiquadCoeffs {
  const f = Math.min(freq, fs * 0.45)
  const a = 10 ** (gainDb / 40)
  const w0 = (2 * Math.PI * f) / fs
  const cosW = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * q)
  let b0: number
  let b1: number
  let b2: number
  let a0: number
  let a1: number
  let a2: number
  if (type === 'peaking') {
    b0 = 1 + alpha * a
    b1 = -2 * cosW
    b2 = 1 - alpha * a
    a0 = 1 + alpha / a
    a1 = -2 * cosW
    a2 = 1 - alpha / a
  } else if (type === 'lowshelf') {
    const k = 2 * Math.sqrt(a) * alpha
    b0 = a * (a + 1 - (a - 1) * cosW + k)
    b1 = 2 * a * (a - 1 - (a + 1) * cosW)
    b2 = a * (a + 1 - (a - 1) * cosW - k)
    a0 = a + 1 + (a - 1) * cosW + k
    a1 = -2 * (a - 1 + (a + 1) * cosW)
    a2 = a + 1 + (a - 1) * cosW - k
  } else {
    const k = 2 * Math.sqrt(a) * alpha
    b0 = a * (a + 1 + (a - 1) * cosW + k)
    b1 = -2 * a * (a - 1 + (a + 1) * cosW)
    b2 = a * (a + 1 + (a - 1) * cosW - k)
    a0 = a + 1 - (a - 1) * cosW + k
    a1 = 2 * (a - 1 - (a + 1) * cosW)
    a2 = a + 1 - (a - 1) * cosW - k
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 }
}

export function magnitudeDb(coeffs: BiquadCoeffs, freq: number, fs: number): number {
  const w = (2 * Math.PI * freq) / fs
  const c1 = Math.cos(w)
  const s1 = Math.sin(w)
  const c2 = Math.cos(2 * w)
  const s2 = Math.sin(2 * w)
  const numRe = coeffs.b0 + coeffs.b1 * c1 + coeffs.b2 * c2
  const numIm = -(coeffs.b1 * s1 + coeffs.b2 * s2)
  const denRe = 1 + coeffs.a1 * c1 + coeffs.a2 * c2
  const denIm = -(coeffs.a1 * s1 + coeffs.a2 * s2)
  const mag2 = (numRe * numRe + numIm * numIm) / (denRe * denRe + denIm * denIm)
  return 10 * Math.log10(mag2)
}

export function responseDb(gains: number[], freq: number, fs = 48000): number {
  let sum = 0
  for (let i = 0; i < BANDS.length; i++) {
    const band = BANDS[i]
    sum += magnitudeDb(design(band.type, band.freq, gains[i] ?? 0, band.q, fs), freq, fs)
  }
  return sum
}

/** Linear preamp: attenuate by half the largest boost so the filters have headroom. */
export function preampGain(enabled: boolean, gains: number[]): number {
  if (!enabled) return 1
  const boost = Math.max(0, ...gains)
  return 10 ** (-boost / 2 / 20)
}

export function clampGain(db: number): number {
  const snapped = Math.round(db * 2) / 2
  return Math.min(MAX_DB, Math.max(-MAX_DB, snapped))
}

export function matchingPreset(gains: number[]): string | null {
  const found = PRESETS.find((preset) => preset.gains.every((gain, index) => gain === gains[index]))
  return found?.name ?? null
}

export function formatDb(db: number): string {
  const text = Number.isInteger(db) ? db.toFixed(0) : db.toFixed(1)
  return `${db > 0 ? '+' : ''}${text} dB`
}
