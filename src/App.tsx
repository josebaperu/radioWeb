import { useEffect, useMemo, useState } from 'react'
import { usePlayer } from './audio/usePlayer.ts'
import { Avatar } from './components/Avatar.tsx'
import { Equalizer } from './components/Equalizer.tsx'
import { IconClose, IconEq, IconHeart, IconMoon, IconSearch, IconSort, IconSun } from './components/Icons.tsx'
import { PlayerBar } from './components/PlayerBar.tsx'
import { stations } from './lib/catalog.ts'
import { applyTheme, loadSaved, resolveTheme, saveSaved, type Saved } from './lib/prefs.ts'
import { filterStations, groupStations, sortStations, titleCase, type Station } from './lib/stations.ts'

export default function App() {
  const { setQueue, setDescending, applyEq, toggle, next, previous, play, setVolume, playback } = usePlayer()
  const [saved, setSaved] = useState<Saved>(loadSaved)
  const [tab, setTab] = useState(() => (favoriteIds(stations, loadSaved().favorites).size === 0 ? 1 : 0))
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [eqOpen, setEqOpen] = useState(false)

  const favorites = useMemo(() => favoriteIds(stations, saved.favorites), [saved.favorites])
  const tabList = useMemo(() => {
    const source = tab === 0 ? stations.filter((station) => favorites.has(station.id)) : stations
    return sortStations(source, saved.sortDescending)
  }, [tab, favorites, saved.sortDescending])
  const shown = useMemo(() => filterStations(tabList, searching ? query : ''), [tabList, searching, query])
  const sections = useMemo(() => groupStations(shown), [shown])
  const current = stations.find((station) => station.id === playback.stationId) ?? null

  useEffect(() => {
    saveSaved(saved)
  }, [saved])

  useEffect(() => {
    applyTheme(resolveTheme(saved.theme))
    if (saved.theme) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(resolveTheme(null))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [saved.theme])

  useEffect(() => {
    setQueue(tabList)
    setDescending(saved.sortDescending)
  }, [setQueue, setDescending, tabList, saved.sortDescending])

  useEffect(() => {
    applyEq(saved.eqEnabled, saved.eqGains)
  }, [applyEq, saved.eqEnabled, saved.eqGains])

  useEffect(() => {
    if (!playback.stationId) return
    setSaved((currentSaved) =>
      currentSaved.lastPlayedId === playback.stationId ? currentSaved : { ...currentSaved, lastPlayedId: playback.stationId },
    )
  }, [playback.stationId])

  useEffect(() => {
    document.title = playback.playing && current ? current.name : 'aautoradio'
  }, [playback.playing, current])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target !== document.body) return
      if (event.code === 'Space') {
        event.preventDefault()
        toggle()
      } else if (event.code === 'ArrowRight') {
        next()
      } else if (event.code === 'ArrowLeft') {
        previous()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, next, previous])

  useEffect(() => {
    if (!eqOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEqOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [eqOpen])

  function toggleFavorite(station: Station) {
    setSaved((currentSaved) => {
      const next = new Set(favoriteIds(stations, currentSaved.favorites))
      if (next.has(station.id)) next.delete(station.id)
      else next.add(station.id)
      return { ...currentSaved, favorites: [...next] }
    })
  }

  function toggleTheme() {
    setSaved((currentSaved) => {
      const resolved = resolveTheme(currentSaved.theme)
      return { ...currentSaved, theme: resolved === 'dark' ? 'light' : 'dark' }
    })
  }

  const dark = resolveTheme(saved.theme) === 'dark'

  return (
    <div className="app">
      <header className="top">
        <div className="title-row">
          {searching ? (
            <input
              className="search"
              value={query}
              autoFocus
              placeholder="Search stations"
              aria-label="Search stations"
              onChange={(event) => setQuery(event.target.value)}
            />
          ) : (
            <h1>aautoradio</h1>
          )}
          <button
            className="icon-btn"
            aria-label={searching ? 'Close search' : 'Search'}
            onClick={() => {
              setSearching((open) => !open)
              setQuery('')
            }}
          >
            {searching ? <IconClose /> : <IconSearch />}
          </button>
        </div>
        <div className="tools">
          <button
            className="text-btn"
            aria-label={saved.sortDescending ? 'Sorted Z to A. Switch to A to Z' : 'Sorted A to Z. Switch to Z to A'}
            onClick={() => setSaved((currentSaved) => ({ ...currentSaved, sortDescending: !currentSaved.sortDescending }))}
          >
            <IconSort />
            {saved.sortDescending ? 'Z–A' : 'A–Z'}
          </button>
          <span className="spacer" />
          <button className="icon-btn" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
            {dark ? <IconSun /> : <IconMoon />}
          </button>
          <button
            className={saved.eqEnabled ? 'icon-btn accent' : 'icon-btn'}
            aria-label="Equalizer"
            onClick={() => setEqOpen(true)}
          >
            <IconEq />
          </button>
        </div>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 0} className={tab === 0 ? 'tab on' : 'tab'} onClick={() => setTab(0)}>
            Favorites · {favorites.size}
          </button>
          <button role="tab" aria-selected={tab === 1} className={tab === 1 ? 'tab on' : 'tab'} onClick={() => setTab(1)}>
            All · {stations.length}
          </button>
        </div>
      </header>

      {shown.length === 0 ? (
        <div className="empty">
          {tab === 0 && !searching
            ? 'No favorites yet. Tap the heart on any station to add it here.'
            : 'No stations match.'}
        </div>
      ) : (
        <main className="list">
          {sections.map((section) => (
            <section key={section.letter}>
              <h2 className="letter">{section.letter}</h2>
              {section.stations.map((station) => {
                const isCurrent = station.id === current?.id
                const isFav = favorites.has(station.id)
                return (
                  <div key={station.id} className={isCurrent ? 'row current' : 'row'}>
                    <button className="row-main" onClick={() => play(station, tabList)} aria-current={isCurrent ? 'true' : undefined}>
                      <Avatar station={station} size={48} playing={isCurrent && playback.playing} />
                      <span className="row-copy">
                        <span className="name">{station.name}</span>
                        <span className="genre">{titleCase(station.genre)}</span>
                      </span>
                    </button>
                    <button
                      className={isFav ? 'icon-btn heart on' : 'icon-btn heart'}
                      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      aria-pressed={isFav}
                      onClick={() => toggleFavorite(station)}
                    >
                      <IconHeart filled={isFav} />
                    </button>
                  </div>
                )
              })}
            </section>
          ))}
        </main>
      )}

      {current ? (
        <PlayerBar
          station={current}
          playback={playback}
          onToggle={toggle}
          onNext={next}
          onPrevious={previous}
          onVolume={(volume) => {
            setVolume(volume)
            setSaved((currentSaved) => ({ ...currentSaved, volume }))
          }}
        />
      ) : null}

      {eqOpen ? (
        <Equalizer
          enabled={saved.eqEnabled}
          gains={saved.eqGains}
          onEnabled={(eqEnabled) => setSaved((currentSaved) => ({ ...currentSaved, eqEnabled }))}
          onGain={(index, gain) =>
            setSaved((currentSaved) => {
              const eqGains = currentSaved.eqGains.map((value, i) => (i === index ? gain : value))
              return { ...currentSaved, eqGains }
            })
          }
          onPreset={(eqGains) => setSaved((currentSaved) => ({ ...currentSaved, eqEnabled: true, eqGains }))}
          onClose={() => setEqOpen(false)}
        />
      ) : null}
    </div>
  )
}

function favoriteIds(list: Station[], stored: string[] | null): Set<string> {
  if (stored) {
    const known = new Set(list.map((station) => station.id))
    return new Set(stored.filter((id) => known.has(id)))
  }
  return new Set(list.filter((station) => station.defaultFavorite).map((station) => station.id))
}
