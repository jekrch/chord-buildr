import "./App.css"
import { AppProvider } from "./components/context/AppContext"
import { PianoComponent } from "./components/PianoComponent"
import { ChordPianoComponent } from "./components/ChordPianoComponent"
import { ChordInput } from "./components/ChordInput"
import { HeaderComponent } from "./components/Layout"

function App() {
  return (
    <div className="App">
      <AppProvider>
        <div class="container">
          <HeaderComponent class="row" />
          <ChordPianoComponent class="row" />
          {/* <ChordPianoComponent class="row" /> */}
        </div>
      </AppProvider>
    </div>
  )
}

export default App
