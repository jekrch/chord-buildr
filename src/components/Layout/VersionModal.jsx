import React from "react"
import Modal from "react-bootstrap/Modal"
import "../../styles/Layout.css"

export function VersionModal(props) {

  const VersionEntry = ({ version, date, items }) => (
    <>
      <div className="verHeader">
        {version} - <span className="verDate">{date}</span>
      </div>
      <p>
        {items.map((item, index) => (
          <div key={index} className="verItem">
            {item}
          </div>
        ))}
      </p>
    </>
  );

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

            <VersionEntry
                version="1.8"
                date="11.03.2024"
                items={[
                  "migrated to typescript and vite",
                ]}
              />

            <VersionEntry
                version="1.7.1"
                date="03.27.2023"
                items={[
                  "fixed bug with slash note notation which caused slash notes to some times use inconsistent accidentals between views",
                ]}
              />

            <VersionEntry
                version="1.7"
                date="03.27.2023"
                items={[
                  "when a key is selected, the other note letters adjust to display the correct notation in that key",
                ]}
              />
              <VersionEntry
                version="1.6"
                date="03.05.2023"
                items={[
                  "when a key is selected, display a roman numeral for each chord",
                  "users can now edit their progression directly in text by clicking on the edit icon in the top nav",
                ]}
              />
              <VersionEntry
                version="1.5"
                date="02.05.2023"
                items={[
                  "add play button to header for cycling through chords",
                  "disable header buttons when unavailable",
                ]}
              />
              <VersionEntry
                version="1.4"
                date="09.19.2021"
                items={[
                  "add synth settings modal",
                  "volume control and five synth voice options",
                  "backwards compatible url encoding for synth settings",
                ]}
              />
              <VersionEntry
                version="1.3"
                date="09.11.2021"
                items={[
                  "adjust volume to reduce distortion",
                  "modify chord volume according to pitch",
                  "version history modal",
                ]}
              />
              <VersionEntry
                version="1.2"
                date="09.05.2021"
                items={[
                  "display flats instead of sharps for a given chord piano",
                  "security updates",
                ]}
              />
              <VersionEntry
                version="1.1"
                date="05.16.2021"
                items={[
                  "redesigned UI for mobile",
                  "improved url handling for facebook and google",
                  "performance improvements",
                ]}
              />
              <VersionEntry
                version="1.0"
                date="03.20.2021"
                items={[
                  "user chord input with interactive keyboards",
                  "url encoded progressions for sharing",
                  "synth playback via buttons and chord chart",
                  "undo and clear functionality",
                  "navigate to chords on chart click",
                ]}
              />
             </p>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}
