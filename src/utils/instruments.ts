import { useEffect, useSyncExternalStore } from "react"
import type { ChordInfo, Instrument } from "./guitarUtil"
import { isGuitar } from "./settings"

/**
 * the guitar and ukulele chord shapes come from chords-db, about 450 KB of
 * json between them. each instrument's is fetched the first time its format
 * is picked, shown, or played, rather than shipped in the main bundle
 */

type InstrumentSpec = Omit<Instrument, "chords"> & {
  load: () => Promise<Record<string, ChordInfo[]>>
}

const INSTRUMENTS: Record<string, InstrumentSpec> = {
  g: {
    strings: 6,
    fretsOnChord: 4,
    name: "Guitar",
    tunings: { standard: ["E", "A", "D", "G", "B", "E"] },
    load: () => import("@tombatossals/chords-db/lib/guitar.json").then((data) => data.default.chords)
  },
  u: {
    strings: 4,
    fretsOnChord: 4,
    name: "Ukulele",
    tunings: { standard: ["G", "C", "E", "A"] },
    load: () => import("@tombatossals/chords-db/lib/ukulele.json").then((data) => data.default.chords)
  }
}

const loaded = new Map<string, Instrument>()
const loading = new Map<string, Promise<Instrument>>()
const listeners = new Set<() => void>()

/**
 * the instrument for a guitar or ukulele format, if its chords have loaded
 */
export function getLoadedInstrument(format: string): Instrument | undefined {
  return loaded.get(format)
}

/**
 * the instrument for a guitar or ukulele format, fetching its chords the
 * first time. a failed fetch is tried again on the next call
 */
export function loadInstrument(format: string): Promise<Instrument> {
  const instrument = loaded.get(format)
  if (instrument) return Promise.resolve(instrument)

  let pending = loading.get(format)
  if (!pending) {
    const spec = INSTRUMENTS[format]
    if (!spec) return Promise.reject(new Error(`no chord shapes for format "${format}"`))

    const { load, ...meta } = spec
    pending = load()
      .then((chords) => {
        const instrument: Instrument = { ...meta, chords }
        loaded.set(format, instrument)
        listeners.forEach((listener) => listener())
        return instrument
      })
      .finally(() => loading.delete(format))
    loading.set(format, pending)
  }
  return pending
}

/**
 * starts fetching the format's chords, if it's a guitar or ukulele format
 * that hasn't loaded yet
 */
export function preloadInstrument(format: string): void {
  if (!isGuitar(format) || loaded.has(format)) return
  loadInstrument(format).catch((error: unknown) =>
    console.error(`failed to load chord shapes for "${format}":`, error)
  )
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * the instrument for a guitar or ukulele format, or undefined until its
 * chords have loaded. the component re-renders when they arrive
 */
export function useInstrument(format: string): Instrument | undefined {
  const instrument = useSyncExternalStore(subscribe, () => loaded.get(format))

  useEffect(() => {
    if (!instrument) preloadInstrument(format)
  }, [format, instrument])

  return instrument
}
