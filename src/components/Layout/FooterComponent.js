import React from "react"
import Navbar from "react-bootstrap/Navbar"
import { AboutModal } from "./AboutModal"
import { VersionModal } from "./VersionModal"
import { ConfigModal } from "./ConfigModal"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCog } from "@fortawesome/free-solid-svg-icons"
import "../../styles/Layout.css"
import GitHub120 from "../../public/images/GitHub120.png"

export const FooterComponent = () => {
  const [aboutModalShow, setAboutModalShow] = React.useState(false)
  const [configModalShow, setConfigModalShow] = React.useState(false)
  const [versionModalShow, setVersionModalShow] = React.useState(false)

  return (
    <>
      <Navbar className="footNav" fixed="bottom">
        <Navbar.Brand href="https://github.com/jekrch/chord-buildr">
          <img className="gitSrc" src={GitHub120} alt="github" />
        </Navbar.Brand>{" "}
        <div
          className="footNavVersion"
          onClick={() => setVersionModalShow(true)}
        >
          v1.3
        </div>
        <div className="footNavAbout" onClick={() => setAboutModalShow(true)}>
          about
        </div>
        <FontAwesomeIcon
          class="footNavCog"
          icon={faCog}
          onClick={() => setConfigModalShow(true)}
        />
        <AboutModal
          show={aboutModalShow}
          onHide={() => setAboutModalShow(false)}
        />
        <VersionModal
          show={versionModalShow}
          onHide={() => setVersionModalShow(false)}
        />
        <ConfigModal
          show={configModalShow}
          onHide={() => setConfigModalShow(false)}
        />
        <h1 className="titleText">chord buildr</h1>
      </Navbar>
    </>
  )
}
