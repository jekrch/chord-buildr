import logo from "./logo.svg"
import "./App.css"
import { AppProvider } from "./components/context/AppContext"
import { PianoComponent } from "./components/PianoComponent"
import { ChordInput } from "./components/ChordInput"
import { HeaderComponent } from "./components/Layout"

function App() {
  return (
    <div className="App">
      <AppProvider>
        <HeaderComponent />
        <ChordInput />
        <PianoComponent />
      </AppProvider>
    </div>
  )
}

export default App
