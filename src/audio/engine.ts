import type Hls from 'hls.js'
import { BANDS, preampGain } from '../lib/eq.ts'
import { stepIndex, type Station } from '../lib/stations.ts'

export type Playback = {
  stationId: string | null
  playing: boolean
  buffering: boolean
  reconnecting: boolean
  error: string | null
  volume: number
}

export type EngineOptions = {
  volume: number
  eqEnabled: boolean
  gains: number[]
  station: Station | null
  descending: boolean
}

const MAX_RETRIES = 6

/**
 * One audio element for the page. Streams play directly in the browser.
 * crossOrigin lets the equalizer tap the audio; the catalog stations allow it.
 */
export class RadioEngine {
  private readonly audio: HTMLAudioElement
  private ctx: AudioContext | null = null
  private preamp: GainNode | null = null
  private filters: BiquadFilterNode[] = []
  private hls: Hls | null = null
  private hlsCtor: (typeof import('hls.js'))['default'] | null = null
  private queue: Station[] = []
  private station: Station | null
  private descending: boolean
  private eqEnabled: boolean
  private gains: number[]
  private volume: number
  private wantPlay = false
  private playing = false
  private buffering = false
  private reconnecting = false
  private error: string | null = null
  private retries = 0
  private mediaRecoveries = 0
  private generation = 0
  private retryTimer = 0
  private ignoreErrors = false
  private readonly listeners = new Set<(snap: Playback) => void>()

  constructor(options: EngineOptions) {
    this.volume = options.volume
    this.eqEnabled = options.eqEnabled
    this.gains = options.gains
    this.station = options.station
    this.descending = options.descending
    this.audio = document.createElement('audio')
    this.audio.crossOrigin = 'anonymous'
    this.audio.preload = 'none'
    this.audio.volume = options.volume
    this.audio.setAttribute('playsinline', '')
    this.audio.hidden = true
    document.body.appendChild(this.audio)
    this.audio.addEventListener('playing', this.onPlaying)
    this.audio.addEventListener('pause', this.onPause)
    this.audio.addEventListener('waiting', this.onWaiting)
    this.audio.addEventListener('ended', this.onEnded)
    this.audio.addEventListener('error', this.onError)
    this.bindSession()
    void import('hls.js').then((mod) => {
      this.hlsCtor = mod.default
    })
  }

  snapshot(): Playback {
    return {
      stationId: this.station?.id ?? null,
      playing: this.playing,
      buffering: this.buffering,
      reconnecting: this.reconnecting,
      error: this.error,
      volume: this.volume,
    }
  }

  subscribe(listener: (snap: Playback) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setQueue(queue: Station[]) {
    this.queue = queue
  }

  setDescending(descending: boolean) {
    this.descending = descending
  }

  setVolume(volume: number) {
    this.volume = volume
    this.audio.volume = volume
    this.emit()
  }

  applyEq(enabled: boolean, gains: number[]) {
    this.eqEnabled = enabled
    this.gains = gains
    if (!this.ctx || !this.preamp) return
    const now = this.ctx.currentTime
    this.filters.forEach((filter, index) => {
      filter.gain.setTargetAtTime(enabled ? (gains[index] ?? 0) : 0, now, 0.02)
    })
    this.preamp.gain.setTargetAtTime(preampGain(enabled, gains), now, 0.02)
  }

  play(station: Station, queue: Station[]) {
    this.queue = queue
    const loaded = this.hls !== null || this.audio.src !== ''
    if (this.station?.id === station.id && loaded && !this.error) {
      if (!this.playing) this.resume()
      return
    }
    this.retries = 0
    this.clearRetry()
    this.open(station, true, true)
  }

  toggle() {
    if (this.playing) this.pause()
    else this.resume()
  }

  pause() {
    this.wantPlay = false
    this.clearRetry()
    this.reconnecting = false
    this.buffering = false
    this.audio.pause()
    this.playing = false
    this.emit()
  }

  resume() {
    if (!this.station) {
      const first = this.queue[0]
      if (first) this.play(first, this.queue)
      return
    }
    if (this.error) this.retries = 0
    this.error = null
    const loaded = this.hls !== null || this.audio.src !== ''
    if (!loaded) {
      this.open(this.station, true, true)
      return
    }
    this.wantPlay = true
    this.buffering = this.audio.readyState < 3
    this.emit()
    this.ensureGraph()
    void this.ctx?.resume()
    void this.audio.play().catch((err: unknown) => {
      if (isNamed(err, 'AbortError')) return
      if (isNamed(err, 'NotAllowedError')) {
        this.wantPlay = false
        this.buffering = false
        this.error = 'Tap play to start'
        this.emit()
        return
      }
      this.fail(this.generation)
    })
  }

  next() {
    this.step(true)
  }

  previous() {
    this.step(false)
  }

  private step(forward: boolean) {
    if (this.queue.length === 0) return
    const index = stepIndex(this.queue, this.station, forward, this.descending)
    const station = this.queue[index]
    if (!station) return
    this.play(station, this.queue)
  }

  /** Swap the stream and call play() in this turn so the browser treats it as a user gesture. */
  private open(station: Station, autoplay: boolean, resetStatus: boolean) {
    const gen = ++this.generation
    this.station = station
    this.wantPlay = autoplay
    this.error = null
    this.playing = false
    this.buffering = autoplay
    if (resetStatus) this.reconnecting = false
    this.emit()

    // Ignore the error event fired by aborting the previous stream.
    this.ignoreErrors = true
    this.destroyHls()
    this.audio.pause()
    this.audio.crossOrigin = 'anonymous'

    const url = station.url
    const nativeHls = url.includes('.m3u8') && this.audio.canPlayType('application/vnd.apple.mpegurl') !== ''
    if (url.includes('.m3u8') && !nativeHls) {
      const ctor = this.hlsCtor
      if (ctor) this.mountHls(ctor, url, gen)
      else {
        void import('hls.js').then((mod) => {
          this.hlsCtor = mod.default
          if (gen !== this.generation) return
          this.mountHls(mod.default, url, gen)
          if (autoplay) this.startPlayback(gen)
        })
        return
      }
    } else {
      this.audio.src = url
      this.audio.load()
    }
    if (!autoplay) {
      this.ignoreErrors = false
      return
    }
    this.startPlayback(gen)
  }

  private mountHls(HlsLib: (typeof import('hls.js'))['default'], url: string, gen: number) {
    if (!HlsLib.isSupported()) {
      this.audio.src = url
      this.audio.load()
      return
    }
    const hls = new HlsLib()
    this.hls = hls
    hls.on(HlsLib.Events.ERROR, (_event, data) => {
      if (!data.fatal || gen !== this.generation) return
      if (data.type === HlsLib.ErrorTypes.MEDIA_ERROR && this.mediaRecoveries < 1) {
        this.mediaRecoveries += 1
        hls.recoverMediaError()
        return
      }
      this.fail(gen)
    })
    hls.loadSource(url)
    hls.attachMedia(this.audio)
  }

  private startPlayback(gen: number) {
    this.ensureGraph()
    void this.ctx?.resume()
    void this.audio.play().then(
      () => {
        if (gen === this.generation) this.ignoreErrors = false
      },
      (err: unknown) => {
        if (gen !== this.generation || isNamed(err, 'AbortError')) return
        this.ignoreErrors = false
        if (isNamed(err, 'NotAllowedError')) {
          this.wantPlay = false
          this.buffering = false
          this.reconnecting = false
          this.error = 'Tap play to start'
          this.emit()
          return
        }
        this.fail(gen)
      },
    )
  }

  private fail(gen: number) {
    if (gen !== this.generation || !this.wantPlay || !this.station) return
    if (this.retryTimer) return
    this.playing = false
    this.buffering = false
    if (this.retries >= MAX_RETRIES) {
      this.reconnecting = false
      this.wantPlay = false
      this.error = "Can't reach this station"
      this.emit()
      return
    }
    const delay = 2000 * 2 ** this.retries
    this.retries += 1
    this.reconnecting = true
    this.error = null
    this.emit()
    const station = this.station
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = 0
      if (gen !== this.generation) return
      this.open(station, true, false)
    }, delay)
  }

  private ensureGraph() {
    if (this.ctx) {
      this.applyEq(this.eqEnabled, this.gains)
      return
    }
    const ctx = new AudioContext()
    const source = ctx.createMediaElementSource(this.audio)
    const preamp = ctx.createGain()
    const filters = BANDS.map((band) => {
      const filter = ctx.createBiquadFilter()
      filter.type = band.type
      filter.frequency.value = band.freq
      filter.Q.value = band.q
      return filter
    })
    source.connect(preamp)
    let tail: AudioNode = preamp
    for (const filter of filters) {
      tail.connect(filter)
      tail = filter
    }
    tail.connect(ctx.destination)
    this.ctx = ctx
    this.preamp = preamp
    this.filters = filters
    this.applyEq(this.eqEnabled, this.gains)
  }

  private destroyHls() {
    this.hls?.destroy()
    this.hls = null
    this.mediaRecoveries = 0
  }

  private clearRetry() {
    if (this.retryTimer) window.clearTimeout(this.retryTimer)
    this.retryTimer = 0
  }

  private emit() {
    this.syncSession()
    const snap = this.snapshot()
    for (const listener of this.listeners) listener(snap)
  }

  private bindSession() {
    if (!('mediaSession' in navigator)) return
    const actions: [MediaSessionAction, () => void][] = [
      ['play', () => this.resume()],
      ['pause', () => this.pause()],
      ['nexttrack', () => this.next()],
      ['previoustrack', () => this.previous()],
    ]
    for (const [action, handler] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // This browser does not support the action.
      }
    }
  }

  private syncSession() {
    if (!('mediaSession' in navigator)) return
    const station = this.station
    if (!station) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: station.genre,
    })
    navigator.mediaSession.playbackState = this.playing ? 'playing' : 'paused'
  }

  private onPlaying = () => {
    this.playing = true
    this.buffering = false
    this.reconnecting = false
    this.retries = 0
    this.mediaRecoveries = 0
    this.error = null
    this.emit()
  }

  private onPause = () => {
    if (this.ignoreErrors || !this.playing) return
    this.playing = false
    this.emit()
  }

  private onWaiting = () => {
    if (!this.wantPlay || this.playing || this.buffering) return
    this.buffering = true
    this.emit()
  }

  private onEnded = () => {
    if (this.wantPlay) this.fail(this.generation)
  }

  private onError = () => {
    if (this.ignoreErrors || !this.wantPlay) return
    this.fail(this.generation)
  }
}

function isNamed(err: unknown, name: string): boolean {
  return err instanceof DOMException && err.name === name
}
