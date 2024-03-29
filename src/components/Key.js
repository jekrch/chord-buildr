import React from "react"
import PropTypes from "prop-types"

export const Key = ({ pianoKey, handleClick }) => {
  return (
    <>
      <li
        key-selected={`${pianoKey.selected}`}
        key-playing={`${pianoKey.isPlaying}`}
        key-stopping={`${
          pianoKey.isStopping !== null ? pianoKey.isStopping : null
        }`}
        className={`${pianoKey.color} ${pianoKey.note} ${pianoKey.note}-${pianoKey.octave}`}
        onClick={() =>
          handleClick(pianoKey.note, pianoKey.noteNumber, pianoKey.octave)
        }
      ></li>
    </>
  )
}

Key.propTypes = {
  pianoKey: PropTypes.object.isRequired,
  handleClick: PropTypes.func
}
