import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { scheduleSemanticWarmUp } from './features/categorizer/semanticIndex'

void navigator.storage?.persist?.()
scheduleSemanticWarmUp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
