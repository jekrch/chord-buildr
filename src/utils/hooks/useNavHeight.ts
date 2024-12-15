import { useState, useEffect } from 'react'

const useNavHeight = (navSelector: string): number => {
  const [navHeight, setNavHeight] = useState(0)

  useEffect(() => {
    // initial measurement
    const measureNav = () => {
      const navElement = document.querySelector(navSelector)
      if (navElement) {
        const height = navElement.getBoundingClientRect().height
        setNavHeight(height)
      }
    }

    // measure initially
    measureNav()

    // setup resize observer for dynamic updates
    const resizeObserver = new ResizeObserver(measureNav)
    const navElement = document.querySelector(navSelector)
    
    if (navElement) {
      resizeObserver.observe(navElement)
    }

    // cleanup
    return () => {
      if (navElement) {
        resizeObserver.unobserve(navElement)
      }
      resizeObserver.disconnect()
    }
  }, [navSelector])

  return navHeight
}

export default useNavHeight