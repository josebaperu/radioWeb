import { hsv, type Station } from '../lib/stations.ts'

export function Avatar({ station, size, playing }: { station: Station; size: number; playing: boolean }) {
  const top = hsv(station.hue, 0.55, 0.85)
  const bottom = hsv((station.hue + 40) % 360, 0.7, 0.55)
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `linear-gradient(160deg, ${top}, ${bottom})`,
        fontSize: size * 0.36,
      }}
    >
      {playing ? (
        <span className="bars" style={{ width: size * 0.46, height: size * 0.46 }}>
          <span />
          <span />
          <span />
        </span>
      ) : (
        station.initials
      )}
    </span>
  )
}
