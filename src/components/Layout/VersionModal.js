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
        <p className="versionDescriptionText changeLogHeader">change log</p>

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
        <div>
          <div class="versionList">
            <p>
              <div class="verHeader">
                1.0 - <span class="verDate">03.20.2021</span>
              </div>
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
              <div class="verHeader">
                1.1 - <span class="verDate">05.16.2021</span>
              </div>
              <p>
                <div class="verItem">redesigned UI for mobile</div>
                <div class="verItem">
                  improved url handling for facebook and google
                </div>
                <div class="verItem">performance improvements</div>
              </p>
              <div class="verHeader">
                1.2 - <span class="verDate">09.05.2021</span>
              </div>
              <p>
                <div class="verItem">
                  display flats instead of sharps for a given chord piano
                </div>
                <div class="verItem">security updates</div>
              </p>
              <div class="verHeader">
                1.3 - <span class="verDate">09.11.2021</span>
              </div>
              <p>
                <div class="verItem">adjust volume to reduce distortion</div>
                <div class="verItem">
                  modify chord volume according to pitch
                </div>
                <div class="verItem">version history modal</div>
              </p>
            </p>
            <div class="verHeader">
              1.4 - <span class="verDate">09.19.2021</span>
            </div>
            <p>
              <div class="verItem">add synth settings modal</div>
              <div class="verItem">
                volume control and five synth voice options
              </div>
              <div class="verItem">
                backwards compatible url encoding for synth settings
              </div>
            </p>
            <div class="verHeader">
              1.5 - <span class="verDate">02.05.2023</span>
            </div>
            <p>
              <div class="verItem">add play button to header for cycling through chords</div>
              <div class="verItem">disable header buttons when unavailable</div>
            </p>
            <div class="verHeader">
              1.6 - <span class="verDate">03.05.2023</span>
            </div>
            <p>
              <div class="verItem">when a key is selected, display a roman numeral for each chord</div>
              <div class="verItem">users can now edit their progression directly in text by clicking on the edit icon in the top nav</div>
            </p>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}
