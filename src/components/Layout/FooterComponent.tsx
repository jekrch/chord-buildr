import React, { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCog } from "@fortawesome/free-solid-svg-icons"
import { AboutModal } from "./AboutModal"
import { VersionModal } from "./VersionModal"
import { ConfigModal } from "./ConfigModal"
import GitHub120 from "../../images/Github120.png"

const APP_VERSION = "v4"
const GITHUB_URL = "https://github.com/jekrch/chord-buildr"

export const FooterComponent: React.FC = () => {
  const [modalState, setModalState] = useState({
    about: false,
    config: false,
    version: false
  })

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
    <nav className="fixed bottom-0 w-full z-50 px-4 py-2 flex items-center footNav">
      {/* left aligned items container */}
      <div className="flex items-center space-x-6 flex-1 align-middle">
        {/* GitHub Link */}
        <a 
          href={GITHUB_URL}
          className="flex items-center no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img 
            className="h-5 w-auto hover:opacity-40" 
            src={GitHub120} 
            alt="GitHub Repository"
          />
        </a>

        {/* Version Button */}
        <button
          className="text-gray-300 hover:opacity-40 cursor-pointer footNavVersion transition-colors"
          onClick={() => handleModalShow("version")}
          tabIndex={0}
        >
          {APP_VERSION}
        </button>

        {/* About Button */}
        <button
          className="text-gray-300 hover:opacity-40 cursor-pointer footNavAbout transition-colors"
          onClick={() => handleModalShow("about")}
          tabIndex={0}
        >
          about
        </button>

        {/* Settings Icon */}
        <button
          className="cursor-pointer text-gray-400  hover:opacity-40 transition-colors"
          onClick={() => handleModalShow("config")}
          tabIndex={0}
        >
          <FontAwesomeIcon
            icon={faCog}
            size="2x"
            className="h-5 w-5 transition-transform duration-900 hover:rotate-[30deg] align-middle mb-[0.1em]"
          />
        </button>
      </div>

      {/* right aligned title */}
      <h1 className="text-xl font-semibold titleText mb-[0.3em]">
        chord buildr
      </h1>

      {/* Modals */}
      <AboutModal
        open={modalState.about}
        onOpenChange={(open: boolean) => !open && handleModalHide("about")}
      />

      <VersionModal
        open={modalState.version}
        onOpenChange={(open: boolean) => !open && handleModalHide("version")}
      />

      <ConfigModal
        open={modalState.config}
        onOpenChange={(open: boolean) => !open && handleModalHide("config")}
      />
    </nav>
  )
}