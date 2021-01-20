import "./App.css"
import React, { useContext } from "react"
import { AppProvider, AppContext } from "./components/context/AppContext"

import { ChordPianoComponent } from "./components/ChordPianoComponent"
import { HeaderComponent } from "./components/Layout"
import Button from "react-bootstrap/Button"
import { PianoBoardComponent } from "./components/PianoBoardComponent"

export const App = () => {
  return (
    <div className="App">
      <AppProvider>
        <div class="container">
          <HeaderComponent class="row" />
          <PianoBoardComponent />
        </div>
      </AppProvider>
    </div>
  )
}

export default App
