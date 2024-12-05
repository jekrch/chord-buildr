import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './App.css'
import './styles/Layout.css'
import './styles/Piano.css'

const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)

root.render(
    <App />,
)