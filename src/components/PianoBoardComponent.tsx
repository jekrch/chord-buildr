import React, { useEffect, useRef } from "react"
import { useAppStore, useChords, useSettings } from "../store/progressionStore"
import useNavHeight from "../utils/hooks/useNavHeight"
import { useBoardView } from "../utils/hooks/useBoardView"
import { useBottomSpacer } from "../utils/hooks/useBottomSpacer"
import { isGuitar } from "../utils/settings"
import InlineConfig from "./InlineConfig"
import MusicalAnimation from "./MusicalAnimation"
import { ProgressionDnd } from "./board/ProgressionDnd"
import { ChartGrid, FrettedGrid, PianoList } from "./board/BoardLayouts"
import { cn } from "../lib/utils"

const WelcomeView: React.FC<{ navHeight: number }> = ({ navHeight }) => (
  <div
    className="pianoBoard view-enter mx-auto flex max-w-md flex-col items-center px-6 text-center"
    style={{ paddingTop: `${navHeight + 80}px` }}
  >
    <MusicalAnimation />
    <h1 className="mt-10 text-lg font-semibold tracking-tight">
      Welcome to Chord Buildr
    </h1>
    <p className="mt-1.5 text-sm text-muted-foreground">
      Use the controls above to get started.
    </p>
    <InlineConfig className="mt-8" />
  </div>
)

/**
 * the progression's cards in the chosen layout, with the format toggle
 * under them, or the welcome screen when there are none yet
 */
export const PianoBoardComponent: React.FC = () => {
  const chords = useChords()
  const { format, fretView } = useSettings()
  const generation = useAppStore((state) => state.generation)
  const navHeight = useNavHeight("nav")
  const { boardKey, layout, viewKey, initialIds, initialBreakIds, formatSwitched } =
    useBoardView(chords, generation, format, fretView)
  const { boardRef, contentRef, spacerRef } = useBottomSpacer(navHeight, viewKey)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute("data-format", isGuitar(format) ? "g" : "p")
  }, [format])

  if (!chords.length) {
    return <WelcomeView key="welcome" navHeight={navHeight} />
  }

  const layoutProps = { chords, initialIds, initialBreakIds }

  return (
    <div
      key={`pianoBoard-${boardKey}`}
      ref={boardRef}
      className={cn(
        "pianoBoard view-enter mx-auto w-full px-2.5 sm:px-4",
        layout === "fretted" ? "max-w-[84rem]" : "max-w-[62rem]"
      )}
      style={{ paddingTop: `${navHeight + 16}px` }}
    >
      <div ref={contentRef}>
        <div key={layout} className={cn(formatSwitched && "view-enter")}>
          {layout === "chart" ? (
            <ChartGrid {...layoutProps} />
          ) : (
            <ProgressionDnd layout={layout} gridRef={gridRef}>
              {layout === "piano"
                ? <PianoList {...layoutProps} />
                : <FrettedGrid {...layoutProps} gridRef={gridRef} />}
            </ProgressionDnd>
          )}
        </div>
        <div data-flip>
          <InlineConfig className="mt-10" />
        </div>
      </div>
      <div ref={spacerRef} aria-hidden="true" />
    </div>
  )
}
