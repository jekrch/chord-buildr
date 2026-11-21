import React, { useEffect, useRef } from 'react'
import { HeaderComponent } from './components/Layout/HeaderComponent'
import { PianoBoardComponent } from './components/PianoBoardComponent'
import { FooterComponent } from './components/Layout/FooterComponent'
import PageScrollbar from './components/Layout/PageScrollbar'
import { ThemeProvider } from './components/theme-provider'
import { prepareAudio } from './audio/player'


const App: React.FC = () => {

  // this silent audio reference is used to prevent the mute function 
  // on iOS devices from blocking tonejs audio
  const silentAudioRef = useRef<HTMLAudioElement>(null)

  // audio starts on the first user gesture, which browsers require
  useEffect(() => {
    const gestures = ['touchstart', 'mousedown', 'click'] as const
    let initialized = false

    const initializeAudio = async () => {
      if (initialized) return
      try {
        // load Tone and start the audio context while we have a gesture,
        // so the first chord played doesn't wait on either
        prepareAudio()

        // for ios, we need to play silent audio first
        await silentAudioRef.current?.play()

        initialized = true
        gestures.forEach((type) => document.removeEventListener(type, initializeAudio))
      } catch (error) {
        console.error('failed to initialize audio:', error)
      }
    }

    gestures.forEach((type) => document.addEventListener(type, initializeAudio))
    return () => gestures.forEach((type) => document.removeEventListener(type, initializeAudio))
  }, [])

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        <HeaderComponent />

        <main className="pb-16">
          <PianoBoardComponent />
          <audio ref={silentAudioRef} preload="auto">
            <source src="/silence.mp3" type="audio/mp3" />
          </audio>
        </main>

        <FooterComponent />
        <PageScrollbar />
      </div>
    </ThemeProvider>
  )
}

export default App