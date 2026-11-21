import React, { useState } from 'react'
import { prefersReducedMotion } from '../chordTransitions'
import { getLoadedInstrument, useInstrument } from '../instruments'

/**
 * switching guitar <-> ukulele keeps chord cards mounted. the chart for
 * the instrument being left stays drawn under the new one while it fades
 * out, and the new chart settles in on top. leavingFormat is that old
 * instrument until the new chart's enter animation (handleEnterEnd) ends.
 *
 * chartFormat is the instrument to draw, and instrument its chord shapes.
 * a newly picked instrument is only drawn once its shapes have loaded, so
 * the old chart stays up meanwhile and the crossfade runs between two
 * drawn charts. instrument is undefined only while the shapes for the
 * first instrument a card shows are loading
 */
const useFormatCrossfade = (format: string) => {
  const ready = useInstrument(format) !== undefined
  const [chartFormat, setChartFormat] = useState(format)
  const [leavingFormat, setLeavingFormat] = useState<string | null>(null)

  const shownInstrument = getLoadedInstrument(chartFormat)
  // with nothing drawn yet there's no old chart to keep up
  const nextFormat = ready || !shownInstrument ? format : chartFormat
  if (chartFormat !== nextFormat) {
    setChartFormat(nextFormat)
    setLeavingFormat(shownInstrument && !prefersReducedMotion() ? chartFormat : null)
  }

  const handleEnterEnd = (event: React.AnimationEvent): void => {
    if (event.target === event.currentTarget) setLeavingFormat(null)
  }

  return {
    chartFormat,
    instrument: shownInstrument,
    leavingFormat,
    leavingInstrument: leavingFormat ? getLoadedInstrument(leavingFormat) : undefined,
    handleEnterEnd
  }
}

export default useFormatCrossfade
