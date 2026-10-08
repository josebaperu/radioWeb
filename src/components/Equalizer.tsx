import { useMemo } from 'react'
import { BANDS, MAX_DB, PRESETS, clampGain, formatDb, matchingPreset, responseDb } from '../lib/eq.ts'
import { IconClose } from './Icons.tsx'

type Props = {
  enabled: boolean
  gains: number[]
  onEnabled: (enabled: boolean) => void
  onGain: (index: number, gain: number) => void
  onPreset: (gains: number[]) => void
  onClose: () => void
}

export function Equalizer({ enabled, gains, onEnabled, onGain, onPreset, onClose }: Props) {
  const preset = matchingPreset(gains)
  return (
    <div className="sheet-root">
      <button className="sheet-backdrop" aria-label="Close equalizer" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="eq-title">
        <div className="sheet-head">
          <div>
            <h2 id="eq-title">Equalizer</h2>
            <p>{preset ?? 'Custom'}</p>
          </div>
          <button
            className={enabled ? 'switch on' : 'switch'}
            role="switch"
            aria-checked={enabled}
            aria-label="Equalizer"
            onClick={() => onEnabled(!enabled)}
          >
            <span />
          </button>
          <button className="icon-btn" aria-label="Close equalizer" onClick={onClose}>
            <IconClose />
          </button>
        </div>
        <div className="chips">
          {PRESETS.map((item) => (
            <button
              key={item.name}
              className={enabled && preset === item.name ? 'chip on' : 'chip'}
              onClick={() => onPreset(item.gains)}
              aria-pressed={enabled && preset === item.name}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className={enabled ? 'eq-card' : 'eq-card off'}>
          <Curve gains={gains} enabled={enabled} />
          <div className="sliders">
            {BANDS.map((band, index) => (
              <label key={band.freq} className="slider">
                <span className="db">{formatDb(gains[index] ?? 0)}</span>
                <span className="vslider-wrap">
                  <input
                    className="vslider"
                    type="range"
                    min={-MAX_DB}
                    max={MAX_DB}
                    step={0.5}
                    value={gains[index] ?? 0}
                    aria-label={`${band.label} hertz`}
                    onChange={(event) => onGain(index, clampGain(Number(event.target.value)))}
                    onDoubleClick={() => onGain(index, 0)}
                  />
                </span>
                <span className="hz">{band.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Curve({ gains, enabled }: { gains: number[]; enabled: boolean }) {
  const { line, fill } = useMemo(() => curve(gains), [gains])
  const color = enabled ? 'var(--primary)' : 'var(--outline)'
  return (
    <svg className="curve" viewBox="0 0 300 72" role="img" aria-label="Equalizer response">
      <line x1="0" y1="36" x2="300" y2="36" stroke="var(--outline-var)" strokeWidth="1" />
      <path d={fill} fill={color} opacity={enabled ? 0.22 : 0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function curve(gains: number[]): { line: string; fill: string } {
  const width = 300
  const height = 72
  const range = MAX_DB + 3
  const lo = Math.log10(20)
  const hi = Math.log10(20000)
  const points: string[] = []
  for (let i = 0; i <= 96; i++) {
    const freq = 10 ** (lo + ((hi - lo) * i) / 96)
    const db = Math.max(-range, Math.min(range, responseDb(gains, freq)))
    const x = (i / 96) * width
    const y = height / 2 - (db / range) * (height / 2)
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  const line = points.join(' ')
  return { line, fill: `${line} L${width} ${height / 2} L0 ${height / 2} Z` }
}
