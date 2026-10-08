import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { stations } from '../lib/catalog.ts'
import { loadSaved } from '../lib/prefs.ts'
import { RadioEngine, type EngineOptions, type Playback } from './engine.ts'
import type { Station } from '../lib/stations.ts'
import { PlayerContext, type PlayerApi } from './player-context.ts'

let engineSingleton: RadioEngine | null = null

function getEngine(): RadioEngine {
  if (!engineSingleton) {
    const saved = loadSaved()
    const options: EngineOptions = {
      volume: saved.volume,
      eqEnabled: saved.eqEnabled,
      gains: saved.eqGains,
      station: stations.find((station) => station.id === saved.lastPlayedId) ?? null,
      descending: saved.sortDescending,
    }
    engineSingleton = new RadioEngine(options)
  }
  return engineSingleton
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [engine] = useState(getEngine)
  const [playback, setPlayback] = useState<Playback>(() => engine.snapshot())

  useEffect(() => engine.subscribe(setPlayback), [engine])

  const actions = useMemo(
    () => ({
      play: (station: Station, queue: Station[]) => engine.play(station, queue),
      toggle: () => engine.toggle(),
      next: () => engine.next(),
      previous: () => engine.previous(),
      setQueue: (queue: Station[]) => engine.setQueue(queue),
      setDescending: (descending: boolean) => engine.setDescending(descending),
      setVolume: (volume: number) => engine.setVolume(volume),
      applyEq: (enabled: boolean, gains: number[]) => engine.applyEq(enabled, gains),
    }),
    [engine],
  )
  const api = useMemo<PlayerApi>(() => ({ ...actions, playback }), [actions, playback])

  return <PlayerContext.Provider value={api}>{children}</PlayerContext.Provider>
}

