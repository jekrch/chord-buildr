// on in the dev server only: off in production builds, and in tests,
// which feed the parsers bad input on purpose
const enabled = import.meta.env.DEV && import.meta.env.MODE !== "test"

/**
 * logs diagnostics that help while developing but mean nothing to a
 * user, such as a url code that couldn't be read. real failures (audio
 * or chord shapes that didn't load) still go to console.error
 */
export function debug(...args: unknown[]): void {
  if (enabled) console.log(...args)
}
