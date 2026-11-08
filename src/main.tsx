import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { scheduleSemanticWarmUp } from './features/categorizer/semanticIndex'
import { warmUpWhisper } from './features/voice/whisperClient'
import { startPendingConversions } from './features/currency/pendingConversions'
import { startAutoBackup } from './features/backup/driveBackup'

void navigator.storage?.persist?.()
scheduleSemanticWarmUp()
setTimeout(warmUpWhisper, 5000)
startPendingConversions()
startAutoBackup()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
