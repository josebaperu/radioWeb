import { describe, expect, it } from 'vitest'
import tsv from '../../stations.tsv?raw'
import {
  filterStations,
  groupLetter,
  hueFor,
  initials,
  parseStations,
  sortStations,
  stepIndex,
  type Station,
} from './stations.ts'

const catalog = parseStations(tsv)

describe('stations', () => {
  it('parses the catalog', () => {
    expect(catalog).toHaveLength(77)
    expect(catalog.filter((station) => station.url.includes('.m3u8'))).toHaveLength(6)
    expect(catalog.map((station) => station.id)).toEqual([...new Set(catalog.map((station) => station.id))])
    const favorites = catalog.filter((station) => station.defaultFavorite).map((station) => station.id)
    expect(favorites).toEqual([
      'radio-paradise-main',
      'fip',
      'jazz-radio',
      'oui-fm',
      'bbc-radio-6-music',
      'radio-swiss-jazz',
    ])
    expect(catalog[0]).toMatchObject({ name: 'Radio Paradise Main', genre: 'eclectic', url: 'https://stream.radioparadise.com/mp3-192' })
  })

  it('skips comments, blanks, and rows without a url', () => {
    const parsed = parseStations('# comment\n\nOnly\t\njazz\nName\thttps://example.test/a\tjazz\t1\nDup\thttps://example.test/b\nDup\thttps://example.test/c\n')
    expect(parsed.map((station) => station.id)).toEqual(['name', 'dup', 'dup-2'])
    expect(parsed[0].defaultFavorite).toBe(true)
  })

  it('matches the phone avatar hue and initials', () => {
    expect(hueFor('FIP')).toBe(133)
    expect(initials('FIP')).toBe('FI')
    expect(initials('Radio Paradise Main')).toBe('RP')
    expect(initials("OUI FM Rock 60's")).toBe('OF')
    expect(groupLetter('Émile')).toBe('E')
    expect(groupLetter('1Xtra')).toBe('#')
  })

  it('sorts without accents and filters the active list', () => {
    const rows = parseStations("Émile\thttps://e.test\njazz\nAlpha\thttps://a.test\nzeta\thttps://z.test\n")
    expect(sortStations(rows, false).map((station) => station.name)).toEqual(['Alpha', 'Émile', 'zeta'])
    expect(sortStations(rows, true).map((station) => station.name)).toEqual(['zeta', 'Émile', 'Alpha'])
    expect(filterStations(rows, 'alp').map((station) => station.name)).toEqual(['Alpha'])
    expect(filterStations(rows, '')).toHaveLength(3)
  })

  it('wraps next and previous inside the tab', () => {
    const list = stations('A', 'C', 'E')
    expect(stepIndex(list, list[0], true, false)).toBe(1)
    expect(stepIndex(list, list[2], true, false)).toBe(0)
    expect(stepIndex(list, list[0], false, false)).toBe(2)
    const outside = stations('B')[0]
    expect(stepIndex(list, outside, true, false)).toBe(1)
    expect(stepIndex(list, outside, false, false)).toBe(0)
  })
})

function stations(...names: string[]): Station[] {
  return parseStations(names.map((name) => `${name}\thttps://example.test/${name}`).join('\n'))
}
