import React from "react"
import PropTypes from "prop-types"

export const Key = ({ pianoKey, handleClick }) => {
  return (
    <>
      <li
        key-selected={`${pianoKey.selected ?? false}`}
        className={pianoKey.color + " " + pianoKey.note}
        onClick={() => handleClick(pianoKey.note)}
      ></li>
    </>
  )
}

Key.propTypes = {
  pianoKey: PropTypes.object.isRequired,
  handleClick: PropTypes.func
}
