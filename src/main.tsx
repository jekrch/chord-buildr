import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './App.css'
import './styles/Layout.css'
import './styles/Piano.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)

root.render(
    <App />,
)