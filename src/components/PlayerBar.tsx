import { Avatar } from './Avatar.tsx'
import { IconNext, IconPause, IconPlay, IconPrev } from './Icons.tsx'
import { titleCase, type Station } from '../lib/stations.ts'
import type { Playback } from '../audio/engine.ts'

type Props = {
  station: Station
  playback: Playback
  onToggle: () => void
  onNext: () => void
  onPrevious: () => void
  onVolume: (volume: number) => void
}

export function PlayerBar({ station, playback, onToggle, onNext, onPrevious, onVolume }: Props) {
  const busy = !playback.playing && (playback.buffering || playback.reconnecting)
  const status = playback.error
    ? playback.error
    : playback.reconnecting
      ? 'Reconnecting…'
      : busy
        ? 'Connecting…'
        : titleCase(station.genre)
  return (
    <footer className="player">
      <Avatar station={station} size={56} playing={playback.playing} />
      <div className="player-copy">
        <strong>{station.name}</strong>
        <span className={playback.error ? 'status bad' : 'status'} aria-live="polite">
          {status}
        </span>
        <input
          className="volume"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={playback.volume}
          aria-label="Volume"
          onChange={(event) => onVolume(Number(event.target.value))}
        />
      </div>
      <div className="transport">
        <button className="icon-btn" aria-label="Previous station" onClick={onPrevious}>
          <IconPrev />
        </button>
        <button className="play" aria-label={playback.playing ? 'Pause' : 'Play'} onClick={onToggle}>
          {busy && !playback.playing ? <span className="spinner" /> : null}
          {playback.playing || busy ? <IconPause /> : <IconPlay />}
        </button>
        <button className="icon-btn" aria-label="Next station" onClick={onNext}>
          <IconNext />
        </button>
      </div>
    </footer>
  )
}
