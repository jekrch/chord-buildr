import { createRoot } from 'react-dom/client'
import App from './App'
import { startUrlSync } from './store/urlSync'
import { useAppStore } from './store/progressionStore'
import { preloadInstrument } from './utils/instruments'
import { preloadModalsWhenIdle } from './components/Layout/lazyModal'
import './index.css'
import './styles/Layout.css'
import './styles/Piano.css'
import './styles/Export.css'

// load the progression in the url before the first render, and keep the
// url in step from then on
startUrlSync()

// fetch the guitar or ukulele chord shapes as soon as that format is in
// the store (from the url, the toggles, or back/forward), ahead of the
// cards that draw them
const preloadFormat = () => preloadInstrument(useAppStore.getState().settings.format)
preloadFormat()
useAppStore.subscribe(preloadFormat)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('index.html has no #root element')
const root = createRoot(rootElement)

root.render(
    <App />,
)

preloadModalsWhenIdle()