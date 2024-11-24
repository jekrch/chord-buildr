import React, { useState } from "react"
import Navbar from "react-bootstrap/Navbar"
// @ts-ignores
import { AboutModal } from "./AboutModal"
// @ts-ignores
import { VersionModal } from "./VersionModal"
import { ConfigModal } from "./ConfigModal"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCog } from "@fortawesome/free-solid-svg-icons"
import "../../styles/Layout.css"
import GitHub120 from "../../images/Github120.png"

const APP_VERSION = "v1.8.1"
const GITHUB_URL = "https://github.com/jekrch/chord-buildr"

export const FooterComponent: React.FC = () => {

  const [modalState, setModalState] = useState({
    about: false,
    config: false,
    version: false
  })

  // handlers for modal vis
  const handleModalShow = (modalType: keyof typeof modalState) => {
    setModalState(prev => ({
      ...prev,
      [modalType]: true
    }))
  }

  const handleModalHide = (modalType: keyof typeof modalState) => {
    setModalState(prev => ({
      ...prev,
      [modalType]: false
    }))
  }

  return (
    <Navbar className="footNav" fixed="bottom">
      <Navbar.Brand href={GITHUB_URL}>
        <img 
          className="gitSrc" 
          src={GitHub120} 
          alt="GitHub Repository"
        />
      </Navbar.Brand>

      <div
        className="footNavVersion"
        onClick={() => handleModalShow("version")}
        role="button"
        tabIndex={0}
      >
        {APP_VERSION}
      </div>

      <div
        className="footNavAbout"
        onClick={() => handleModalShow("about")}
        role="button"
        tabIndex={0}
      >
        about
      </div>

      <FontAwesomeIcon
        className="footNavCog"
        icon={faCog}
        onClick={() => handleModalShow("config")}
        role="button"
        tabIndex={0}
      />

      <AboutModal
        show={modalState.about}
        onHide={() => handleModalHide("about")}
      />

      <VersionModal
        show={modalState.version}
        onHide={() => handleModalHide("version")}
      />

      <ConfigModal
        show={modalState.config}
        onHide={() => handleModalHide("config")}
      />

      <h1 className="titleText">chord buildr</h1>
    </Navbar>
  )
}