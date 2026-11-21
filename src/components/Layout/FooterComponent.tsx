import React, { useState } from "react"
import { Github, Settings } from "lucide-react"
import { lazyModal } from "./lazyModal"

const AboutModal = lazyModal(() => import("./AboutModal"))
const VersionModal = lazyModal(() => import("./VersionModal"))
const ConfigModal = lazyModal(() => import("./ConfigModal").then((m) => ({ default: m.ConfigModal })))

const APP_VERSION = "v5.1"
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

  const linkClass =
    "rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors " +
    "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  const iconClass =
    "group grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors " +
    "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 flex overflow-x-clip h-12 items-center gap-1 border-t border-border bg-background/95 px-2 backdrop-blur-sm sm:px-3">
      <a
        href={GITHUB_URL}
        className={iconClass}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Source on GitHub"
        title="Source on GitHub"
      >
        <Github className="h-[18px] w-[18px]" />
      </a>

      <button
        className={linkClass}
        onClick={() => handleModalShow("version")}
      >
        {APP_VERSION}
      </button>

      <button
        className={linkClass}
        onClick={() => handleModalShow("about")}
      >
        About
      </button>

      <button
        className={iconClass}
        onClick={() => handleModalShow("config")}
        aria-label="Settings"
        title="Settings"
      >
        <Settings className="h-[18px] w-[18px] transition-transform duration-500 group-hover:rotate-45" />
      </button>

      <button
        className="wordmark ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => handleModalShow("about")}
      >
        chord buildr
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
    </footer>
  )
}