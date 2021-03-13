import React, { useContext } from "react"
import Nav from "react-bootstrap/Nav"
import Navbar from "react-bootstrap/Navbar"
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"
import "../../styles/Layout.css"
import { AppContext } from "../context/AppContext"
import { playPiano } from "../../utils/synthPlayer"
import { isSlashChord } from "../../utils/chordCodeHandler"
import { Link } from "react-scroll"
import GitHub120 from "../../public/images/GitHub120.png"

export const FooterComponent = () => {
  const { state, dispatch } = useContext(AppContext)

  const [modalShow, setModalShow] = React.useState(false)

  function AboutModal(props) {
    return (
      <Modal
        {...props}
        size="l"
        className="aboutModal"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          {/* <Modal.Title id="contained-modal-title-vcenter">
            Chord Buildr
          </Modal.Title> */}
        </Modal.Header>
        <Modal.Body>
          <p className="aboutDescriptionText">
            Chord Buildr provides an easy way for musicians and music lovers to
            create and share chord progressions.
          </p>
          <br />
          <p>
            <h5>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-music-note"
                viewBox="0 0 16 16"
              >
                <path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z" />
                <path fill-rule="evenodd" d="M9 3v10H8V3h1z" />
                <path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z" />
              </svg>{" "}
              transpose
            </h5>
            <div className="aboutFeatureText">
              Mark a chord as the key and the rest of your progression will
              transpose as you change its root note.{" "}
            </div>
            <br />
            <h5>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-music-note-beamed"
                viewBox="0 0 16 16"
              >
                <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z" />
                <path fill-rule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z" />
                <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z" />
              </svg>{" "}
              share
            </h5>
            <div className="aboutFeatureText">
              To share a progression, simply copy the URL. No account needed!
            </div>
            <br />
          </p>
          <p className="creditsText">
            Chord Buildr is an{" "}
            <a
              className="modalText"
              href="https://github.com/jekrch/chord-buildr"
            >
              open source
            </a>{" "}
            project started by <br />
            <a className="modalText" href="https://www.jacobkrch.com">
              Jacob Krch
            </a>{" "}
            and{" "}
            <a
              className="modalText"
              href="https://www.linkedin.com/in/teran-keith-210941107/"
            >
              Teran Keith
            </a>{" "}
            <br />
            using Node.js, React, and Tone.js.
          </p>
        </Modal.Body>
      </Modal>
    )
  }

  return (
    <>
      <Navbar className="footNav" fixed="bottom">
        <Navbar.Brand href="https://github.com/jekrch/chord-buildr">
          <img className="gitSrc" src={GitHub120} />
        </Navbar.Brand>{" "}
        <div className="footNavText">v1.0</div>
        <div className="footNavAbout" onClick={() => setModalShow(true)}>
          About
        </div>
        <AboutModal show={modalShow} onHide={() => setModalShow(false)} />
        <h1 className="titleText">chord buildr</h1>
      </Navbar>
    </>
  )
}