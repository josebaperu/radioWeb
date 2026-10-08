import { createContext } from 'react'
import type { Playback } from './engine.ts'
import type { Station } from '../lib/stations.ts'

export type PlayerApi = {
  playback: Playback
  play: (station: Station, queue: Station[]) => void
  toggle: () => void
  next: () => void
  previous: () => void
  setQueue: (queue: Station[]) => void
  setDescending: (descending: boolean) => void
  setVolume: (volume: number) => void
  applyEq: (enabled: boolean, gains: number[]) => void
}

export const PlayerContext = createContext<PlayerApi | null>(null)
