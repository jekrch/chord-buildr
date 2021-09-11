import React from "react"
import Navbar from "react-bootstrap/Navbar"
import Modal from "react-bootstrap/Modal"
import "../../styles/Layout.css"
import GitHub120 from "../../public/images/GitHub120.png"

export const FooterComponent = () => {
  const [aboutModalShow, setAboutModalShow] = React.useState(false)

  const [versionModalShow, setVersionModalShow] = React.useState(false)

  function AboutModal(props) {
    return (
      <Modal
        {...props}
        size="l"
        className="aboutModal"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header className="modalHeader" closeButton>
          <div className="headerBackground" />
        </Modal.Header>
        <Modal.Body>
          <p className="aboutDescriptionText">
            Chord Buildr provides an easy way for musicians and music lovers to
            create and share chord progressions.
          </p>
          <hr className="modalLine" />
          <p>
            <h6>
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
            </h6>
            <div className="aboutFeatureText">
              Mark a chord as the key and the rest of your progression will
              transpose as you change its root note.{" "}
            </div>
            <br />
            <h6>
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
            </h6>
            <div className="aboutFeatureText">
              To share a progression, simply copy the URL. No account needed!
            </div>
            <br />
          </p>
          {/* <hr className="aboutLine"/> */}
          <p className="creditsText">
            Chord Buildr is an{" "}
            <a
              className="modalText"
              href="https://github.com/jekrch/chord-buildr"
            >
              open source
            </a>{" "}
            project <br /> by{" "}
            <a className="modalText" href="https://www.jacobkrch.com">
              Jacob Krch
            </a>{" "}
            and{" "}
            <a
              className="modalText"
              href="https://www.linkedin.com/in/teran-keith-210941107/"
            >
              Teran Keith
            </a>
          </p>
          <p className="copyrightText">
            &copy; 2020-
            {new Date().getFullYear()} Jacob Krch All Rights Reserved
          </p>
        </Modal.Body>
      </Modal>
    )
  }

  function VersionModal(props) {
    return (
      <Modal
        {...props}
        size="l"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header className="modalHeader" closeButton>
          <div className="headerBackground" />
          <br />
        </Modal.Header>
        <Modal.Body
          class="verModalBody"
          scrollable={true}
          style={{
            maxHeight: "calc(100vh - 210px)",
            overflowY: "auto"
          }}
        >
          <br />
          <p className="versionDescriptionText">Version history</p>
          <br />
          <div>
            <div class="versionList3">
              <p>
                <div class="verHeader">1.0 - 03.20.2021</div>
                <p>
                  <div class="verItem">
                    user chord input with interactive keyboards
                  </div>
                  <div class="verItem">
                    url encoded progressions for sharing
                  </div>
                  <div class="verItem">
                    synth playback via buttons and chord chart
                  </div>
                  <div class="verItem">undo and clear functionality</div>
                  <div class="verItem">navigate to chords on chart click</div>
                </p>
                <div class="verHeader">1.1 - 05.16.2021</div>
                <p>
                  <div class="verItem">redesigned UI for mobile</div>
                  <div class="verItem">
                    improved url handling for facebook and google
                  </div>
                  <div class="verItem">performance improvements</div>
                </p>
                <div class="verHeader">1.2 - 09.05.2021</div>
                <p>
                  <div class="verItem">
                    display flats instead of sharps for a given chord piano
                  </div>
                  <div class="verItem">security updates</div>
                </p>
                <div class="verHeader">1.3 - 09.11.2021</div>
                <p>
                  <div class="verItem">adjust volume to reduce distortion</div>
                  <div class="verItem">
                    modify chord volume according to pitch
                  </div>
                  <div class="verItem">version history modal</div>
                </p>
              </p>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    )
  }

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
        <AboutModal
          show={aboutModalShow}
          onHide={() => setAboutModalShow(false)}
        />
        <VersionModal
          show={versionModalShow}
          onHide={() => setVersionModalShow(false)}
        />
        <h1 className="titleText">chord buildr</h1>
      </Navbar>
    </>
  )
}
