import logo from "./logo.svg"
import "./App.css"
import { HelloWorld } from "./components/HelloWorld"
import { PianoComponent } from "./components/PianoComponent"
import { HeaderComponent } from "./components/Layout"

function App() {
  return (
    <div className="App">
      <HeaderComponent />
      <PianoComponent />
    </div>
  )
}

export default App
