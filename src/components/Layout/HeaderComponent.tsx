import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, scroller } from "react-scroll"
import { ChevronDown, Eraser, Play, Plus, SquarePen, Undo2 } from "lucide-react"
import { AppState, useAppContext } from "../context/AppContext"
import { ChordPiano } from "../../utils/chordPianoHandler"
import { playChordById, subscribeToMobilePlayingChord } from "../../utils/synthPlayer"
import { isMobile } from "react-device-detect"
import { Button } from '../../components/ui/button'
import { 
  getChordDisplay, 
  getProgressionString, 
  convertProgressionStrToCode,
  getSynthCode
} from "../../utils/chordCodeHandler"
import { generateBaseUrlParams } from "../../utils/urlUtil"
import { isGuitar } from "../../utils/guitarUtil"
import { cn } from "../../lib/utils"
import { prefersReducedMotion } from "../../utils/chordTransitions"
// NEW: Import the modal component from its own file
import { ProgressionEditorModal } from "./ProgressionEditorModal" 

interface PianoRange {
  first: number
  last: number
}

// how far a chord the strip scrolls to is kept from its edges, clear of
// their fade
const STRIP_INSET = 32

// how briskly the strip glides to where it's headed (a critically damped
// spring's natural frequency, per second): most of the way in about a
// quarter second, settling over half a second without overshooting
const STRIP_SPRING = 11

type StripAxis = "left" | "top"

/**
 * glides the strip to a scroll position. a new destination mid-glide
 * bends the strip's path from its current speed rather than starting over
 * from a standstill, as a smooth scrollBy would, so following the page
 * through a run of quick changes stays one continuous motion. it lets go
 * as soon as the user takes hold of the strip
 */
const useStripGlide = (stripRef: React.RefObject<HTMLDivElement | null>) => {
  const glideRef = useRef({ axis: "left" as StripAxis, target: 0, position: 0, velocity: 0, time: 0, frame: 0 });

  const read = (strip: HTMLElement, axis: StripAxis) =>
    axis === "left" ? strip.scrollLeft : strip.scrollTop;

  const write = (strip: HTMLElement, axis: StripAxis, value: number) => {
    if (axis === "left") strip.scrollLeft = value;
    else strip.scrollTop = value;
  };

  const stop = useCallback(() => {
    const glide = glideRef.current;
    cancelAnimationFrame(glide.frame);
    glide.frame = 0;
    glide.velocity = 0;
  }, []);

  const step = useCallback((now: number) => {
    const strip = stripRef.current;
    const glide = glideRef.current;
    if (!strip) {
      glide.frame = 0;
      return;
    }

    // something else moved the strip, e.g. the user scrolling it
    if (Math.abs(read(strip, glide.axis) - glide.position) > 2) {
      stop();
      return;
    }

    // a stalled frame (a background tab) carries on rather than leaping
    const dt = Math.min((now - glide.time) / 1000, 0.05);
    glide.time = now;

    const max = glide.axis === "left"
      ? strip.scrollWidth - strip.clientWidth
      : strip.scrollHeight - strip.clientHeight;
    const target = Math.min(max, Math.max(0, glide.target));

    // the spring's exact step, which holds steady at any frame rate
    const offset = glide.position - target;
    const decay = Math.exp(-STRIP_SPRING * dt);
    const pull = (glide.velocity + STRIP_SPRING * offset) * dt;
    glide.position = target + (offset + pull) * decay;
    glide.velocity = (glide.velocity - STRIP_SPRING * pull) * decay;

    if (Math.abs(glide.position - target) < 0.5 && Math.abs(glide.velocity) < 5) {
      glide.position = target;
      write(strip, glide.axis, target);
      glide.frame = 0;
      glide.velocity = 0;
      return;
    }

    write(strip, glide.axis, glide.position);
    glide.frame = requestAnimationFrame(step);
  }, [stripRef, stop]);

  const glideTo = useCallback((axis: StripAxis, target: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const glide = glideRef.current;

    if (prefersReducedMotion()) {
      stop();
      write(strip, axis, target);
      return;
    }

    if (!glide.frame || glide.axis !== axis) {
      stop();
      if (Math.abs(target - read(strip, axis)) < 1) return;
      glide.axis = axis;
      glide.position = read(strip, axis);
      glide.time = performance.now();
      glide.frame = requestAnimationFrame(step);
    }
    glide.target = target;
  }, [stripRef, step, stop]);

  // where the strip is headed, or where it is when it's not moving
  const destination = useCallback((axis: StripAxis) => {
    const strip = stripRef.current;
    const glide = glideRef.current;
    if (!strip) return 0;
    return glide.frame && glide.axis === axis ? glide.target : read(strip, axis);
  }, [stripRef]);

  useEffect(() => stop, [stop]);

  return { glideTo, destination, stop };
};

interface ScrollOptions {
  duration: number
  smooth: boolean
  offset: number
  spy: boolean
  hashSpy: boolean
  to: string
}

export const HeaderComponent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [newChordAdded, setNewChordAdded] = useState(false);
  const [currPlayChordIndex, setCurrPlayChordIndex] = useState(-1);
  const [headerOffset, setHeaderOffset] = useState(-130);
  const [currentlyPlayingPianoId, setCurrentlyPlayingPianoId] = useState<number | undefined>(undefined);
  const [isProgressionEditorOpen, setIsProgressionEditorOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const progressionRef = useRef<HTMLDivElement>(null);
  const [activePianoId, setActivePianoId] = useState<number | undefined>(undefined);
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0, visible: false, snap: true });
  const stripRef = useRef<HTMLDivElement>(null);
  const { glideTo: glideStrip, destination: stripDestination, stop: stopStripGlide } = useStripGlide(stripRef);
  const [stripExpanded, setStripExpanded] = useState(false);
  const [stripOverflow, setStripOverflow] = useState({ canToggle: false, start: false, end: false });
  const [visibleRange, setVisibleRange] = useState<PianoRange | null>(null);
  const [followPaused, setFollowPaused] = useState(false);
  // how far the strip sits from where following would put it, and the
  // page position that was last measured from (see the follow effect)
  const followOffsetRef = useRef(0);
  const followPageYRef = useRef(0);
  const resumingRef = useRef(false);
  
    /**
   * When a chord is played we want it to be scrolled to. Where we 
   * scroll to should be determined in part by the height of this
   * header so the header doesn't cover the chord when the header 
   * height expands due to large progressions
   */
  useEffect(() => {
    // mobile doesn't mark chords as playing in state; see below
    if (!isMobile) {
      const playingPianoId = state.chordPianoSet?.filter(piano => piano.isPlaying)[0]?.id;
      setCurrentlyPlayingPianoId(playingPianoId);
    }

    const updateOffset = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.getBoundingClientRect().height;
        setHeaderOffset(-headerHeight - 10);
      }
    };
    updateOffset();
    const resizeObserver = new ResizeObserver(updateOffset);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [state.chordPianoSet]); // recalculate when chord set changes

  // on mobile the player reports the playing chord to the header directly,
  // since it doesn't dispatch it (see playChord)
  useEffect(() => {
    if (!isMobile) return;
    return subscribeToMobilePlayingChord(setCurrentlyPlayingPianoId);
  }, []);

  /**
   * Slide the strip's underline to the playing chord, or to the one the
   * page is scrolled to when nothing is playing. When it has been hidden
   * it jumps straight to its spot (snap) and fades in instead of sliding
   * over from wherever it was last
   */
  const indicatorPianoId = currentlyPlayingPianoId ?? activePianoId;

  useLayoutEffect(() => {
    const container = progressionRef.current;
    if (!container) return;

    const place = () => {
      const link = indicatorPianoId === undefined
        ? null
        : container.querySelector<HTMLElement>(`[data-piano-id="${indicatorPianoId}"]`);

      setIndicator(prev => {
        if (!link) return prev.visible ? { ...prev, visible: false } : prev;

        // inset by the link's horizontal padding so the line sits under the text
        const next = {
          x: link.offsetLeft + 4,
          y: link.offsetTop + link.offsetHeight,
          width: link.offsetWidth - 8,
          visible: true,
          snap: !prev.visible
        };
        const unchanged = prev.visible && prev.x === next.x && prev.y === next.y && prev.width === next.width;
        return unchanged ? prev : next;
      });
    };

    place();
    // chords reflow when the strip wraps, the window resizes or fonts load
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [indicatorPianoId, state.chordPianoSet]);

  /**
   * the strip keeps to one line and scrolls sideways, unless expanded to
   * wrap onto as many lines as it needs. the toggle only shows when there
   * is more than one line's worth: collapsed, when the chords run past the
   * strip; expanded, when they've wrapped. the edges fade on whichever
   * side has chords scrolled out of view
   */
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const row = progressionRef.current;
    if (!strip || !row) return;

    const measure = () => {
      let canToggle: boolean;
      if (stripExpanded) {
        const links = row.querySelectorAll<HTMLElement>("[data-piano-id]");
        canToggle = links.length > 1 && links[links.length - 1].offsetTop !== links[0].offsetTop;
      } else {
        canToggle = strip.scrollWidth > strip.clientWidth + 1;
      }
      const start = !stripExpanded && strip.scrollLeft > 1;
      const end = !stripExpanded && strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;

      setStripOverflow(prev =>
        prev.canToggle === canToggle && prev.start === start && prev.end === end
          ? prev
          : { canToggle, start, end }
      );
    };

    // the scrollbar is hidden, so a mouse wheel scrolls the strip sideways
    const handleWheel = (e: WheelEvent) => {
      if (stripExpanded || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (strip.scrollWidth <= strip.clientWidth) return;
      e.preventDefault();
      stopStripGlide();
      strip.scrollLeft += e.deltaY;
    };

    // a glide toward the chords on screen lets go when the strip is touched
    const handleTouch = () => stopStripGlide();

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(strip);
    resizeObserver.observe(row);
    strip.addEventListener("scroll", measure, { passive: true });
    strip.addEventListener("wheel", handleWheel, { passive: false });
    strip.addEventListener("touchstart", handleTouch, { passive: true });
    return () => {
      resizeObserver.disconnect();
      strip.removeEventListener("scroll", measure);
      strip.removeEventListener("wheel", handleWheel);
      strip.removeEventListener("touchstart", handleTouch);
    };
  }, [stripExpanded, state.chordPianoSet, stopStripGlide]);

  // expanding or collapsing the strip switches which way it scrolls
  useEffect(() => stopStripGlide(), [stripExpanded, stopStripGlide]);

  /**
   * track which chords are on screen between the header and footer, as
   * the first and last of them in board order, so the strip can follow
   * the page. this covers every layout, including the guitar grid where
   * several chords share a row
   */
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const top = headerRef.current?.getBoundingClientRect().bottom ?? 0;
      const bottom = document.querySelector("footer")?.getBoundingClientRect().top ?? window.innerHeight;
      let first: number | undefined;
      let last: number | undefined;

      document.querySelectorAll<HTMLElement>('[id^="piano-"]').forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.bottom > top + 8 && rect.top < bottom - 8) {
          const id = Number(card.id.slice("piano-".length));
          first ??= id;
          last = id;
        }
      });

      setVisibleRange(prev => {
        if (first === undefined || last === undefined) return null;
        return prev?.first === first && prev.last === last ? prev : { first, last };
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [state.chordPianoSet, state.format, state.fretView]);

  /**
   * playing a chord leaves the strip where it is, even though playing from
   * the strip or the play button scrolls the page to the chord, so what was
   * just clicked doesn't slide away from under the pointer. it only moves
   * as far as it must to keep every chord on screen in view. the strip
   * picks up following again once the user scrolls the page themselves (a
   * scroll of the strip itself doesn't count)
   */
  useEffect(() => {
    if (currentlyPlayingPianoId !== undefined) setFollowPaused(true);
  }, [currentlyPlayingPianoId]);

  useEffect(() => {
    if (!followPaused) return;

    const SCROLL_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
    const resume = (e: Event) => {
      if (e.target instanceof Node && stripRef.current?.contains(e.target)) return;
      if (e instanceof KeyboardEvent && !SCROLL_KEYS.includes(e.key)) return;
      // a press on the page's own scrollbar lands on the root element
      if (e.type === "pointerdown" && e.target !== document.documentElement) return;
      resumingRef.current = true;
      setFollowPaused(false);
    };

    const events = ["wheel", "touchmove", "keydown", "pointerdown"];
    events.forEach(type => window.addEventListener(type, resume, { passive: true }));
    return () => events.forEach(type => window.removeEventListener(type, resume));
  }, [followPaused]);

  /**
   * scroll the strip to the chords on screen: centered when they fit, or
   * from the first one when they don't. an expanded strip that's capped
   * in height scrolls up and down instead. it only reacts to the chords
   * being added, removed or moved, not to one starting to play.
   *
   * when following resumes after a pause, the strip doesn't jump to its
   * spot. it keeps its distance from it as an offset and moves on from
   * where it is, by the same steps it would have taken anyway, while the
   * offset shrinks with every bit the page is scrolled (to about a third
   * per screen height), so it eases back into place. paused or not, the
   * chords on screen all stay in view whenever they fit
   */
  const followFirst = visibleRange?.first;
  const followLast = visibleRange?.last;
  const chordOrder = state.chordPianoSet?.map(piano => piano.id).join(",");

  // adding, removing or moving chords shows the change, paused or not
  useEffect(() => {
    followOffsetRef.current = 0;
    setFollowPaused(false);
  }, [chordOrder]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || followFirst === undefined || followLast === undefined) return;

    const first = strip.querySelector(`[data-piano-id="${followFirst}"]`);
    const last = strip.querySelector(`[data-piano-id="${followLast}"]`);
    if (!first || !last) return;

    const view = strip.getBoundingClientRect();
    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();

    if (stripExpanded) {
      // up and down only as far as it takes to bring the chords into view,
      // measured from where the strip is headed if it's already moving
      const headedBy = stripDestination("top") - strip.scrollTop;
      const aTop = a.top - view.top - headedBy;
      const bBottom = b.bottom - view.bottom - headedBy;
      let top = 0;
      if (aTop < 0) top = aTop - 8;
      else if (bBottom > 0) top = Math.min(bBottom + 8, aTop - 8);
      if (Math.abs(top) >= 1) glideStrip("top", strip.scrollTop + headedBy + top);
      return;
    }

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    // the chords on screen, in the strip's scroll coordinates
    const start = a.left - view.left + strip.scrollLeft;
    const end = b.right - view.left + strip.scrollLeft;
    const maxLeft = strip.scrollWidth - strip.clientWidth;
    const fits = end - start <= view.width - STRIP_INSET * 2;

    const target = clamp(fits ? (start + end) / 2 - view.width / 2 : start - STRIP_INSET, 0, maxLeft);

    // every position that keeps all of them in view, or the one that
    // starts from the first when they're too many to fit
    const low = fits ? end + STRIP_INSET - view.width : start - STRIP_INSET;
    const high = start - STRIP_INSET;

    // the playing chord, with its underline, has to be in view above all,
    // e.g. one played from a card further down than the strip can reach
    // while it shows the chords on screen from the first
    const playing = currentlyPlayingPianoId === undefined
      ? null
      : strip.querySelector(`[data-piano-id="${currentlyPlayingPianoId}"]`)?.getBoundingClientRect();
    const playingLow = playing ? playing.right - view.left + strip.scrollLeft + STRIP_INSET - view.width : -Infinity;
    const playingHigh = playing ? playing.left - view.left + strip.scrollLeft - STRIP_INSET : Infinity;

    const keepInView = (left: number) =>
      clamp(clamp(clamp(left, low, high), playingLow, playingHigh), 0, maxLeft);

    // where the strip is already gliding to, so a glide under way isn't
    // pulled up short
    const current = stripDestination("left");

    let next: number;
    // a chord starting to play pauses following too, but that's only set
    // after this runs, so playing counts as paused here already
    if (followPaused || playing) {
      // stay put, short of letting a chord on screen fall out of view
      next = keepInView(current);
    } else if (resumingRef.current) {
      resumingRef.current = false;
      followPageYRef.current = window.scrollY;
      next = keepInView(current);
      followOffsetRef.current = next - target;
    } else {
      const scrolled = Math.abs(window.scrollY - followPageYRef.current);
      followPageYRef.current = window.scrollY;
      let offset = followOffsetRef.current * Math.exp(-scrolled / window.innerHeight);
      if (Math.abs(offset) < 4) offset = 0;
      next = keepInView(target + offset);
      // whatever keeping the chords in view took off the offset stays off
      followOffsetRef.current = next - target;
    }

    if (Math.abs(next - current) >= 1) glideStrip("left", next);
  }, [followFirst, followLast, stripExpanded, chordOrder, followPaused, currentlyPlayingPianoId, glideStrip, stripDestination]);

  const navigateToPianoById = (pianoId: number): void => {
    const targetKey = `piano-${pianoId}`
    const options: ScrollOptions = {
      duration: 500,
      smooth: true,
      offset: headerOffset,
      spy: true,
      hashSpy: true,
      to: targetKey
    }
    scroller.scrollTo(targetKey, options)
  }

  const handleClickPlay = (): void => {
    if (!state.chordPianoSet?.length) return;
    const nextPianoId = getNextPlayPianoId();
    navigateToPianoById(nextPianoId);
    handleItemClick(nextPianoId);
  }

  const getNextPlayPianoId = (): number => {
    const nextPianoIndex = getNextPlayChordIndex();
    setCurrPlayChordIndex(nextPianoIndex);
    return state.chordPianoSet?.[nextPianoIndex]!.id ?? 0
  }

  const getNextPlayChordIndex = (): number => {
    let nextPianoIndex = currPlayChordIndex + 1
    if (nextPianoIndex >= (state.chordPianoSet?.length ?? 0)) {
      nextPianoIndex = 0
    }
    return nextPianoIndex
  }

  const handleClickAddChord = (): void => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })
    setNewChordAdded(true)
  }

  useEffect(() => {
    if (!state.chordPianoSet?.length) return

    if (newChordAdded) {
      // the first chord mounts the board itself, mid view-enter lift, and
      // there is nothing above it to scroll past
      if (state.chordPianoSet.length > 1) {
        const lastPianoId = state.chordPianoSet[state.chordPianoSet.length - 1].id ?? 0;
        navigateToPianoById(lastPianoId)
      }
      setNewChordAdded(false)
    }
  }, [state.chordPianoSet, newChordAdded])

  const handleClickClear = (): void => {
    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: generateBaseUrlParams(state)
    })
  }

  const handleUndoClick = (): void => {
    dispatch({
      type: "LOAD_PREVIOUS_PROG_CODE"
    })
  }

  const handleItemClick = (id: number): void => {
    // paused before the page starts scrolling to the chord, which can be
    // before the chord is marked as playing
    setFollowPaused(true)
    playChordById(dispatch, state, id)
  }

  const getCurrentSynthVolCode = (state: AppState): string => {
    // built from the live state, since instrument and chord view changes
    // don't update currentProgCode
    return `?s=${getSynthCode(state)}&`
  }

  // UPDATED: This function now simply opens the modal.
  const openProgressionEditor = (): void => {
    setIsProgressionEditorOpen(true);
  }

  // This callback handles the logic after the user saves in the modal.
  const handleSaveProgression = (submittedProgressionStr: string): void => {
    if (!submittedProgressionStr) {
      return
    }
    
    const synthVolCode = getCurrentSynthVolCode(state);
    const newProgressionString = convertProgressionStrToCode(submittedProgressionStr);

    if (newProgressionString) {
      dispatch({
        type: "BUILD_PROG_FROM_CODE",
        payload: `${synthVolCode}p=${newProgressionString}`
      })
      dispatch({
        type: "REFRESH_BOARD"
      })
    }
  }

  /**
   * a hairline between two chords, tilted into a slash where a section
   * break follows the first one. display only: breaks are added from the
   * board, since a clickable seam this close to the chords was too easy
   * to hit by mistake. the last chord only gets one when the progression
   * ends with a break
   */
  const renderSeam = (piano: ChordPiano, isLast: boolean): React.ReactNode => {
    const isBreak = piano.breakAfter !== undefined
    if (isLast && !isBreak) return null

    return (
      <span className="chord-seam" data-break={isBreak || undefined} aria-hidden="true">
        <span className="section-slash" />
      </span>
    )
  }

  const renderProgression = (): React.JSX.Element[] | undefined => {
    return state.chordPianoSet?.map((piano, i) => (
      <div
        key={`ci-${piano.id}`}
        className="flex items-center"
      >
        <Link
          className={cn("chord-link", piano.id === currentlyPlayingPianoId && "is-playing")}
          data-piano-id={piano.id}
          to={`piano-${piano.id}`}
          spy={!isGuitar(state.format)}
          offset={headerOffset}
          isDynamic={true}
          duration={500}
          smooth={true}
          onSetActive={() => setActivePianoId(piano.id)}
          onSetInactive={() => setActivePianoId(id => (id === piano.id ? undefined : id))}
          onClick={() => handleItemClick(piano.id)}
        >
          {getChordDisplay(piano.selectedChord)}
        </Link>
        {renderSeam(piano, i === (state.chordPianoSet?.length ?? 0) - 1)}
      </div>
    ))
  }

  // icons carry a few px of empty space inside their box, so the leading
  // padding is trimmed to keep icon + label optically centered
  const actionButtonClass = "pl-2 pr-2.5 sm:h-9 sm:pl-3.5 sm:pr-4"

  // Return a fragment <> to include the modal as a sibling to the nav.
  return (
    <>
      <nav
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm"
      >
        <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:gap-2.5 sm:py-3">
          <Button
            size="sm"
            // the filled triangle reads larger than the outline icons beside it
            className={cn(actionButtonClass, "[&_svg]:size-3.5")}
            onClick={handleClickPlay}
            disabled={!state.chordPianoSet?.length}
          >
            <Play className="fill-current" />
            Play
          </Button>
          <Button
            size="sm"
            className={actionButtonClass}
            onClick={handleClickAddChord}
          >
            <Plus />
            Add
          </Button>
          <span className="mx-0.5 h-5 w-px bg-border sm:mx-1" aria-hidden="true" />
          <Button
            variant="secondary"
            size="sm"
            className={actionButtonClass}
            disabled={!state.previousProgCodes?.length}
            onClick={handleUndoClick}
          >
            <Undo2 />
            Undo
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className={actionButtonClass}
            disabled={!state.chordPianoSet?.length}
            onClick={handleClickClear}
          >
            <Eraser />
            Clear
          </Button>
        </div>

        <div className="border-t border-border/70 bg-card/60">
          <div className="mx-auto flex min-h-11 max-w-[62rem] items-center gap-1 px-2 py-1 sm:px-4">
            {/* the edge fade masks this wrapper rather than the scroller
                itself, which mobile browsers can leave unpainted after a
                view transition (an instrument switch) */}
            <div
              className="chord-strip-fade min-w-0 flex-1"
              data-overflow={(!stripExpanded && stripOverflow.canToggle) || undefined}
              data-fade-start={stripOverflow.start || undefined}
              data-fade-end={stripOverflow.end || undefined}
            >
              <div
                ref={stripRef}
                className={cn(
                  "chord-strip py-1.5",
                  stripExpanded ? "max-h-[40vh] overflow-y-auto" : "overflow-x-auto"
                )}
              >
                <div
                  ref={progressionRef}
                  className={cn(
                    "relative flex items-center gap-y-2",
                    // w-max + mx-auto centers a short strip and starts a long
                    // one at its left edge, where justify-center would cut it
                    // off. the padding keeps the first and last chords clear
                    // of the strip's edges and their fade
                    stripExpanded ? "flex-wrap justify-center px-2" : "mx-auto w-max px-4"
                  )}
                >
                  {state.chordPianoSet?.length ? (
                    renderProgression()
                  ) : (
                    <span className="text-sm text-muted-foreground">No chords yet</span>
                  )}
                  <span
                    className="chord-indicator"
                    aria-hidden="true"
                    data-snap={indicator.snap.toString()}
                    style={{
                      width: indicator.width,
                      transform: `translate(${indicator.x}px, ${indicator.y}px)`,
                      opacity: indicator.visible ? 1 : 0
                    }}
                  />
                </div>
              </div>
            </div>
            {stripOverflow.canToggle && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-expanded={stripExpanded}
                aria-label={stripExpanded ? "Show chords on one line" : "Show all chords"}
                title={stripExpanded ? "Collapse" : "Show all chords"}
                onClick={() => {
                  followOffsetRef.current = 0;
                  setStripExpanded(expanded => !expanded);
                }}
              >
                <ChevronDown
                  className={cn("transition-transform duration-300 motion-reduce:transition-none", stripExpanded && "rotate-180")}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label="Edit progression as text"
              title="Edit progression as text"
              onClick={openProgressionEditor}
            >
              <SquarePen />
            </Button>
          </div>
        </div>
      </nav>

      {/* Render the modal and pass the necessary props. */}
      <ProgressionEditorModal
        open={isProgressionEditorOpen}
        onOpenChange={setIsProgressionEditorOpen}
        initialProgression={getProgressionString(state.chordPianoSet ?? [])}
        onSave={handleSaveProgression}
      />
    </>
  )
}
