import React, { useReducer, createContext, useEffect } from "react"
import PropTypes from "prop-types"
import { pianoGenerator } from "../../utils/pianoHelper"

export const STATE_NAME = "PIANO_STATE"

const initialState = {
  piano: pianoGenerator()
}

const persistedState = JSON.parse(sessionStorage.getItem(STATE_NAME))

const finalInitialState = { ...initialState, ...persistedState }

const appReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_PIANO":
      return { ...state, piano: action.payload }
    default:
      return state
  }
}

export const AppContext = createContext()

export const AppProvider = props => {
  const [state, dispatch] = useReducer(appReducer, finalInitialState)

  useEffect(() => {
    sessionStorage.setItem(STATE_NAME, JSON.stringify(state))
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {props.children}
    </AppContext.Provider>
  )
}

AppProvider.propTypes = {
  children: PropTypes.element
}
