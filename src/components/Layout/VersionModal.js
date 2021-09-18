import React from "react"
import Modal from "react-bootstrap/Modal"
import "../../styles/Layout.css"

export function VersionModal(props) {
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
                <div class="verItem">url encoded progressions for sharing</div>
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
