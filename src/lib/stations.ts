export type Station = {
  id: string
  name: string
  url: string
  genre: string
  defaultFavorite: boolean
  hue: number
  groupLetter: string
  initials: string
}

const collator = new Intl.Collator('en', { sensitivity: 'base' })

export function parseStations(text: string): Station[] {
  const used = new Set<string>()
  const stations: Station[] = []
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '')
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const cols = line.split('\t')
    if (cols.length < 2 || !cols[1].trim()) continue
    const name = cols[0].trim()
    let id = slug(name)
    let n = 2
    while (used.has(id)) {
      id = `${slug(name)}-${n++}`
    }
    used.add(id)
    stations.push({
      id,
      name,
      url: cols[1].trim(),
      genre: (cols[2] ?? '').trim(),
      defaultFavorite: (cols[3] ?? '').trim() === '1',
      hue: hueFor(name),
      groupLetter: groupLetter(name),
      initials: initials(name),
    })
  }
  return stations
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'station'
}

/** Java String.hashCode, so avatar colors match the Android app. */
export function javaHash(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0
  }
  return hash
}

export function hueFor(name: string): number {
  return (javaHash(name) & 0x7fffffff) % 360
}

export function groupLetter(name: string): string {
  const first = name.trim().charAt(0)
  if (!first) return '#'
  const base = first.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
  return /^\p{L}$/u.test(base) ? base : '#'
}

export function initials(name: string): string {
  const words = name.split(/[ \-']+/).filter((word) => word.length > 0)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0].slice(0, 1) + words[1].slice(0, 1)).toUpperCase()
}

export function titleCase(genre: string): string {
  if (!genre) return ''
  return genre.charAt(0).toLocaleUpperCase() + genre.slice(1)
}

export function sortStations(list: Station[], descending: boolean): Station[] {
  const ascending = [...list].sort((a, b) => collator.compare(a.name, b.name))
  return descending ? ascending.reverse() : ascending
}

export function filterStations(list: Station[], query: string): Station[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter((station) => station.name.toLowerCase().includes(q) || station.genre.toLowerCase().includes(q))
}

export function groupStations(list: Station[]): { letter: string; stations: Station[] }[] {
  const groups: { letter: string; stations: Station[] }[] = []
  for (const station of list) {
    const last = groups[groups.length - 1]
    if (!last || last.letter !== station.groupLetter) groups.push({ letter: station.groupLetter, stations: [station] })
    else last.stations.push(station)
  }
  return groups
}

/** Next/previous index in the active tab, wrapping around. Stations outside the tab jump to their alphabetical neighbour. */
export function stepIndex(list: Station[], current: Station | null, forward: boolean, descending: boolean): number {
  if (list.length === 0) return -1
  if (!current) return forward ? 0 : list.length - 1
  const direct = list.findIndex((station) => station.id === current.id)
  if (direct >= 0) return (direct + (forward ? 1 : -1) + list.length) % list.length
  const merged = sortStations([...list, current], descending)
  const pos = merged.findIndex((station) => station.id === current.id)
  return forward ? pos % list.length : (pos - 1 + list.length) % list.length
}

export function hsv(h: number, s: number, v: number): string {
  const c = v * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const hex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}
