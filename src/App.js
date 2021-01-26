import "./App.css"
import React from "react"
import { Route, Switch } from "react-router"
import { BrowserRouter as Router } from "react-router-dom"
import { AppProvider } from "./components/context/AppContext"
import { HeaderComponent } from "./components/Layout"
import { PianoBoardComponent } from "./components/PianoBoardComponent"

export const App = () => {
  return (
    <div className="App">
      <AppProvider>
        <div class="container">
          <Router>
            <HeaderComponent class="row" />
            <Switch>
              <Route exact path="/" component={PianoBoardComponent}/>
            </Switch>
          </Router>
        </div>
      </AppProvider>
    </div>
  )
}

export default App
