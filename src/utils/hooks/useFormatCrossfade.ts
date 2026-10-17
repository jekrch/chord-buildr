import React, { useState } from 'react'
import { isGuitar } from '../guitarUtil'
import { prefersReducedMotion } from '../chordTransitions'

/**
 * switching guitar <-> ukulele keeps chord cards mounted. the chart for
 * the instrument being left stays drawn under the new one while it fades
 * out, and the new chart settles in on top. leavingFormat is that old
 * instrument until the new chart's enter animation (handleEnterEnd) ends
 */
const useFormatCrossfade = (format: string) => {
  const [shownFormat, setShownFormat] = useState(format)
  const [leavingFormat, setLeavingFormat] = useState<string | null>(null)
  if (shownFormat !== format) {
    setShownFormat(format)
    setLeavingFormat(isGuitar(shownFormat) && !prefersReducedMotion() ? shownFormat : null)
  }

  const handleEnterEnd = (event: React.AnimationEvent): void => {
    if (event.target === event.currentTarget) setLeavingFormat(null)
  }

  return { leavingFormat, handleEnterEnd }
}

export default useFormatCrossfade
