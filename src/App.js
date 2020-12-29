import logo from "./logo.svg"
import "./App.css"

import { PianoComponent } from "./components/PianoComponent"
import { ChordInput } from "./components/ChordInput"
import { HeaderComponent } from "./components/Layout"

function App() {
  return (
    <div className="App">
      <HeaderComponent />
      <ChordInput />
      <PianoComponent />
    </div>
  )
}

export default App
