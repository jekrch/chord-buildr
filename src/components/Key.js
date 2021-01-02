import React from "react"
import PropTypes from "prop-types"

export const Key = ({ pianoKey }) => {
  return (
    <>
      <li className={pianoKey.color + " " + pianoKey.note}></li>
    </>
  )
}

Key.propTypes = {
  pianoKey: PropTypes.object.isRequired
}
