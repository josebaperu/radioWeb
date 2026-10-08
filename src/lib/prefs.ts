import { clampGain } from './eq.ts'

const KEY = 'webradio.prefs'

export type ThemeChoice = 'light' | 'dark'

export type Saved = {
  favorites: string[] | null
  lastPlayedId: string | null
  sortDescending: boolean
  theme: ThemeChoice | null
  eqEnabled: boolean
  eqGains: number[]
  volume: number
}

const defaultGains = [0, 0, 0, 0, 0]

export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const parsed = JSON.parse(raw) as Partial<Saved>
    const gains =
      Array.isArray(parsed.eqGains) && parsed.eqGains.length === 5
        ? parsed.eqGains.map((gain) => clampGain(Number(gain)))
        : [...defaultGains]
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((id) => typeof id === 'string') : null,
      lastPlayedId: typeof parsed.lastPlayedId === 'string' ? parsed.lastPlayedId : null,
      sortDescending: parsed.sortDescending === true,
      theme: parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : null,
      eqEnabled: parsed.eqEnabled !== false,
      eqGains: gains,
      volume: typeof parsed.volume === 'number' && Number.isFinite(parsed.volume) ? Math.min(1, Math.max(0, parsed.volume)) : 1,
    }
  } catch {
    return fresh()
  }
}

export function saveSaved(prefs: Saved) {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

export function resolveTheme(theme: ThemeChoice | null): ThemeChoice {
  if (theme) return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: ThemeChoice) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141218' : '#fef7ff')
}

function fresh(): Saved {
  return {
    favorites: null,
    lastPlayedId: null,
    sortDescending: false,
    theme: null,
    eqEnabled: true,
    eqGains: [...defaultGains],
    volume: 1,
  }
}
