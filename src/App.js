import "./App.css"
import React from "react"
import { Route, Switch } from "react-router"
import { BrowserRouter as Router } from "react-router-dom"
import { AppProvider } from "./components/context/AppContext"
import { HeaderComponent } from "./components/Layout"
import { PianoBoardComponent } from "./components/PianoBoardComponent"
import { FooterComponent } from "./components/Layout/FooterComponent"

export const App = () => {
  return (
    <div className="App">
      <AppProvider className="">
        <HeaderComponent className="" />
        <div className=" mainContainer">
          <Router>
            <Switch>
              <Route exact path="/" component={PianoBoardComponent} />
            </Switch>
          </Router>
        </div>
        <FooterComponent className="" />
      </AppProvider>
    </div>
  )
}

export default App
