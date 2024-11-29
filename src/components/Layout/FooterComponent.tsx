import React, { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCog } from "@fortawesome/free-solid-svg-icons"
import { AboutModal } from "./AboutModal"
import { VersionModal } from "./VersionModal"
import { ConfigModal } from "./ConfigModal"
import GitHub120 from "../../images/Github120.png"

const APP_VERSION = "v1.8.1"
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
    <nav className="fixed bottom-0 w-full bg-white border-t shadow-sm z-50 px-4 py-2 flex items-center justify-between footNav">
      {/* GitHub Link */}
      <a 
        href={GITHUB_URL}
        className="flex items-center no-underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img 
          className="h-8 w-auto gitSrc" 
          src={GitHub120} 
          alt="GitHub Repository"
        />
      </a>

      {/* Version Button */}
      <button
        className="text-gray-600 hover:text-gray-900 px-2 cursor-pointer footNavVersion transition-colors"
        onClick={() => handleModalShow("version")}
        tabIndex={0}
      >
        {APP_VERSION}
      </button>

      {/* About Button */}
      <button
        className="text-gray-600 hover:text-gray-900 px-2 cursor-pointer footNavAbout transition-colors"
        onClick={() => handleModalShow("about")}
        tabIndex={0}
      >
        about
      </button>

      {/* Settings Icon */}
      <button
        className="text-gray-600 hover:text-gray-900 cursor-pointer footNavCog transition-colors"
        onClick={() => handleModalShow("config")}
        tabIndex={0}
      >
        <FontAwesomeIcon
          icon={faCog}
          className="h-5 w-5"
        />
      </button>

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

      {/* Title */}
      <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-semibold titleText">
        chord buildr
      </h1>
    </nav>
  )
}