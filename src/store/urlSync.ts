import { serializeProgressionCode, serializeShareCode } from "../codec"
import { useAppStore, AppStore } from "./progressionStore"

/**
 * keeps the url's query in step with the store, both ways:
 *
 * - on start, a code in the url replaces whatever the tab had saved
 * - a change to the progression adds a history entry; a change to the
 *   settings alone (e.g. turning an eq knob) replaces the current one
 * - back and forward load the code they land on
 *
 * returns a function that stops syncing
 */

type Store = typeof useAppStore

// chord names can contain '#', so the code runs on into the url's hash
const readUrlCode = (): string => window.location.search + window.location.hash

const getShareCode = (state: AppStore): string => serializeShareCode(state.settings, state.chords)

const toUrl = (code: string): string => `${window.location.pathname}?${code}`

export function startUrlSync(store: Store = useAppStore): () => void {
  let applyingUrl = false

  const loadFromUrl = () => {
    const code = readUrlCode()
    if (!code) return

    applyingUrl = true
    try {
      store.getState().actions.loadShareCode(code)
    } finally {
      applyingUrl = false
    }
  }

  loadFromUrl()

  // the url as the app writes it, e.g. after older or hand-edited links
  let written = getShareCode(store.getState())
  if (store.getState().chords.length || readUrlCode()) {
    if (readUrlCode() !== `?${written}`) window.history.replaceState(null, "", toUrl(written))
  }

  const unsubscribe = store.subscribe((state, prev) => {
    if (state.chords === prev.chords && state.settings === prev.settings) return

    const code = getShareCode(state)
    if (applyingUrl || code === written) {
      written = code
      return
    }

    const progressionChanged =
      state.chords !== prev.chords &&
      serializeProgressionCode(state.chords) !== serializeProgressionCode(prev.chords)

    written = code
    if (progressionChanged) window.history.pushState(null, "", toUrl(code))
    else window.history.replaceState(null, "", toUrl(code))
  })

  window.addEventListener("popstate", loadFromUrl)

  return () => {
    unsubscribe()
    window.removeEventListener("popstate", loadFromUrl)
  }
}
