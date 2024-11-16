import React, { useEffect, useRef } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { useAppContext, getPianoById, getProgKeyChord } from "./context/AppContext"
import { getNoteLetter } from "../utils/noteManager"
import { getChordNumeral } from "../utils/numeralHelper"
import { playPiano } from "../utils/synthPlayer"
import PropTypes from "prop-types"

export const PianoComponent = ({ pianoComponentId, forceUpdate }) => {
  const { state, dispatch } = useAppContext()
  const pianoId = pianoComponentId
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      // Force a re-render of the piano keys on mount
      const piano = getPianoById(state, pianoId)
      if (piano) {
        dispatch({
          type: "REFRESH_PIANO",
          id: pianoId,
          payload: piano
        })
      }
    }
  }, [pianoId, state, dispatch])

  // Force update when parent signals
  useEffect(() => {
    if (forceUpdate) {
      const piano = getPianoById(state, pianoId)
      if (piano) {
        dispatch({
          type: "REFRESH_PIANO",
          id: pianoId,
          payload: piano
        })
      }
    }
  }, [forceUpdate, pianoId, state, dispatch])

  const handleClick = (note, noteNumber, octave) => {
    const noteLetter = getNoteLetter("C", noteNumber)
    const selectedKey = {
      noteLetter,
      octave
    }
    dispatch({
      type: "UPDATE_KEY",
      id: pianoId,
      payload: selectedKey
    })
  }

  const handleClickRemovePiano = () => {
    dispatch({
      type: "REMOVE_PIANO",
      id: pianoId
    })
  }

  const handlePlayClick = () => {
    playPiano(dispatch, state, pianoId)
  }

  const getNumeralChord = () => {
    const piano = getPianoById(state, pianoId)
    const key = getProgKeyChord(state)
    return getChordNumeral(key, piano.selectedChord)
  }

  const renderPiano = () => {
    const piano = getPianoById(state, pianoId)?.piano || []
    return piano.map((octave, i) => 
      octave.map((pianoKey) => ({
        ...pianoKey,
        octave: i,
        key: `${pianoKey.note}-${i}-${forceUpdate}`,
        handleClick: () => handleClick(pianoKey.note, pianoKey.noteNumber, i)
      }))
    ).flat().map(pianoKey => (
      <Key
        key={pianoKey.key}
        pianoKey={pianoKey}
        handleClick={pianoKey.handleClick}
      />
    ))
  }

  return (
    <>
      <div className="pianoContainer">
        <button
          type="button"
          className="piano-play-button"
          onClick={handlePlayClick}
        />
        <div className="pianoBox">
          <button
            type="button"
            className="close pianoCloseButton"
            aria-label="Close"
            onClick={handleClickRemovePiano}
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <ul className="set">{renderPiano()}</ul>
        </div>
        <div className="closeContainer">
          <button
            type="button"
            className="close pianoCloseButtonMobile"
            aria-label="Close"
            onClick={handleClickRemovePiano}
          >
            <span className="mobileClosedBtnText">&times;</span>
          </button>
        </div>
      </div> 
      <div className="pianoRomanNumeral">
        {getNumeralChord()}
      </div>
    </>
  )
}

PianoComponent.propTypes = {
  pianoComponentId: PropTypes.number.isRequired,
  forceUpdate: PropTypes.number
}

export const PianoBoardComponent = () => {
  const { state, dispatch } = useAppContext()
  const history = useHistory()
  const [refresh, setRefresh] = useState(0)
  const initialLoadRef = useRef(false)

  // Handle initial load
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      const newParams = history.location.search + history.location.hash
      if (newParams) {
        dispatch({
          type: "BUILD_PROG_FROM_CODE",
          payload: newParams
        })
        setRefresh(prev => prev + 1)
      }
    }
  }, [dispatch, history.location])

  // Handle URL changes
  useEffect(() => {
    const currentCode = getProgressionCode(state)
    const newParams = history.location.search + history.location.hash

    if (!state.building && currentCode !== newParams) {
      dispatch({
        type: "BUILD_PROG_FROM_CODE",
        payload: newParams
      })
      setRefresh(prev => prev + 1)
    }
  }, [history.location.search, history.location.hash, state.building, dispatch])

  const renderChordPianoSet = () => {
    return state.chordPianoSet?.map((chordPiano) => (
      <div key={`wrapper-${chordPiano.id}-${refresh}`}>
        <ChordPianoComponent
          id={`piano-${chordPiano.id}`}
          pianoComponentId={Number(chordPiano.id)}
          forceUpdate={refresh}
          history={history}
        />
        <div className="pianoStrip" />
      </div>
    ))
  }

  return (
    <div className="pianoBoard">
      {state.chordPianoSet?.length ? (
        <> 
          {renderChordPianoSet()}   
          <div className="pianoBoardGutter" />
        </>
      ) : (
        <div className="introBody">
          <div className="introText">
            welcome to chord buildr<br/>
            use the controls above to get started
          </div>
        </div>
      )}
    </div>
  )
}