import { describe, expect, it } from 'vitest'
import { clampGain, matchingPreset, preampGain, responseDb } from './eq.ts'

describe('equalizer', () => {
  it('stays flat when every band is at zero', () => {
    for (const freq of [40, 230, 1000, 4000, 12000]) {
      expect(Math.abs(responseDb([0, 0, 0, 0, 0], freq))).toBeLessThan(0.05)
    }
  })

  it('boosts the shelf the gain asks for', () => {
    expect(responseDb([12, 0, 0, 0, 0], 30)).toBeGreaterThan(11)
    expect(responseDb([0, 0, 0, 0, 12], 18000)).toBeGreaterThan(10)
    expect(responseDb([0, 0, 6, 0, 0], 910)).toBeGreaterThan(5)
  })

  it('names presets and leaves headroom for boosts', () => {
    expect(matchingPreset([5, 2, -2, 2, 5])).toBe('Rock')
    expect(matchingPreset([1, 0, 0, 0, 0])).toBeNull()
    expect(preampGain(true, [6, 0, 0, 0, 0])).toBeCloseTo(10 ** (-3 / 20), 5)
    expect(preampGain(false, [6, 0, 0, 0, 0])).toBe(1)
    expect(clampGain(12.4)).toBe(12)
    expect(clampGain(0.24)).toBe(0)
    expect(clampGain(-0.8)).toBe(-1)
  })
})
