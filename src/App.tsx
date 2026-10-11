import React, { useEffect, useRef } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router'
import { AppProvider } from './components/context/AppContext'
import { HeaderComponent } from './components/Layout/HeaderComponent'
import { PianoBoardComponent } from './components/PianoBoardComponent'
import { FooterComponent } from './components/Layout/FooterComponent'
import { ThemeProvider } from './components/theme-provider'


const App: React.FC = () => {

  // this silent audio reference is used to prevent the mute function 
  // on iOS devices from blocking tonejs audio
  const silentAudioRef = useRef<HTMLAudioElement>(null)
  const audioInitializedRef = useRef(false)

  // audio initialization
  const initializeAudio = async () => {
    if (!audioInitializedRef.current) {
      try {
        // for ios, we need to play silent audio first
        await silentAudioRef.current?.play()
        
        audioInitializedRef.current = true
        
        // cleanup listeners after successful initialization
        document.removeEventListener('touchstart', initializeAudio)
        document.removeEventListener('mousedown', initializeAudio)
        document.removeEventListener('click', initializeAudio)
      } catch (error) {
        console.error('failed to initialize audio:', error)
      }
    }
  }

  useEffect(() => {
    // event listeners for user interaction
    document.addEventListener('touchstart', initializeAudio)
    document.addEventListener('mousedown', initializeAudio)
    document.addEventListener('click', initializeAudio)

    // cleanup event listeners on unmount
    return () => {
      document.removeEventListener('touchstart', initializeAudio)
      document.removeEventListener('mousedown', initializeAudio)
      document.removeEventListener('click', initializeAudio)
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        <AppProvider>
          <HeaderComponent />

          <main className="pb-16">
            <Router>
              <Routes>
                <Route path="/" element={<PianoBoardComponent />} />
                <Route path="/chord-buildr/" element={<PianoBoardComponent />} />
              </Routes>
            </Router>
            <audio ref={silentAudioRef} preload="auto">
              <source src="/silence.mp3" type="audio/mp3" />
            </audio>
          </main>

          <FooterComponent />
        </AppProvider>
      </div>
    </ThemeProvider>
  )
}

export default App