import "./App.css"
import { AppProvider } from "./components/context/AppContext"
import { PianoComponent } from "./components/PianoComponent"
import { ChordInput } from "./components/ChordInput"
import { HeaderComponent } from "./components/Layout"

function App() {
  return (
    <div className="App">
      <AppProvider>
        <div class="container">
          <HeaderComponent class="row" />
          <div class="contentBox row">
            <div class="pianoChordBox">
              <ChordInput class="chordBox" />
              <PianoComponent class="pianoBox" />
            </div>
          </div>
        </div>
      </AppProvider>
    </div>
  )
}

export default App
