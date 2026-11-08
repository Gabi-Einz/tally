import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOverlayStack } from './app/useOverlayStack'
import { ExpenseDetail } from './features/expenses/ExpenseDetail'
import { ExpenseForm } from './features/expenses/ExpenseForm'
import { ExpensesScreen } from './features/expenses/ExpensesScreen'
import { HomeScreen } from './features/home/HomeScreen'
import { ComingSoonScreen } from './features/placeholders/ComingSoonScreen'
import { SummaryScreen } from './features/summary/SummaryScreen'
import { VoiceSheet } from './features/voice/VoiceSheet'
import { isWebSpeechSupported } from './features/voice/webSpeech'
import {
  draftFromTranscript,
  type ExpenseDraft,
} from './features/expenses/draft'

type Tab = 'home' | 'expenses' | 'summary' | 'settings'
type Overlay =
  | { name: 'detail'; id: string }
  | { name: 'form'; id?: string; draft?: ExpenseDraft }
  | { name: 'voice' }

const DICTATION_LANG = 'es-AR'
type ExpensesView = { key: number; month?: string; filter?: string }

const TABS: Tab[] = ['home', 'expenses', 'summary', 'settings']

function App() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('home')
  const { stack, push, replace, pop } = useOverlayStack<Overlay>()
  const [voiceAvailable] = useState(isWebSpeechSupported)
  const top = stack.at(-1)

  const [expensesView, setExpensesView] = useState<ExpensesView>({ key: 0 })

  const openDetail = (id: string) => push({ name: 'detail', id })
  const openForm = (id?: string) => push({ name: 'form', id })

  const openVoice = () => push({ name: 'voice' })
  const confirmTranscript = (text: string) =>
    replace({ name: 'form', draft: draftFromTranscript(text, DICTATION_LANG) })

  const showCategoryExpenses = (month: string, categoryId: string) => {
    setExpensesView((v) => ({ key: v.key + 1, month, filter: categoryId }))
    setTab('expenses')
  }

  const selectTab = (id: Tab) => {
    if (id === 'expenses' && tab !== 'expenses')
      setExpensesView((v) => ({ key: v.key + 1 }))
    setTab(id)
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <main className="flex-1 overflow-y-auto" inert={!!top}>
        {tab === 'home' && (
          <HomeScreen
            voiceAvailable={voiceAvailable}
            onSpeak={openVoice}
            onAdd={() => openForm()}
            onOpen={openDetail}
          />
        )}
        {tab === 'expenses' && (
          <ExpensesScreen
            key={expensesView.key}
            initialMonth={expensesView.month}
            initialFilter={expensesView.filter}
            onAdd={() => openForm()}
            onOpen={openDetail}
          />
        )}
        {tab === 'summary' && (
          <SummaryScreen onSelectCategory={showCategoryExpenses} />
        )}
        {tab === 'settings' && (
          <ComingSoonScreen
            title={t('settings.title')}
            message={t('settings.soon')}
          />
        )}
      </main>

      <nav
        className="flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="Tally"
        inert={!!top}
      >
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs ${
              tab === id ? 'font-semibold text-brand' : 'text-muted'
            }`}
          >
            <span
              className={`h-1 w-5 rounded-full bg-current ${tab === id ? '' : 'opacity-40'}`}
              aria-hidden="true"
            />
            {t(`nav.${id}`)}
          </button>
        ))}
      </nav>

      {top && (
        <div className="fixed inset-0 z-20 mx-auto max-w-md overflow-y-auto bg-surface">
          {top.name === 'detail' && (
            <ExpenseDetail
              key={top.id}
              id={top.id}
              onBack={pop}
              onEdit={openForm}
            />
          )}
          {top.name === 'form' && (
            <ExpenseForm
              key={top.id ?? top.draft?.rawTranscript ?? 'new'}
              id={top.id}
              draft={top.draft}
              onDone={pop}
              onRetry={top.draft ? () => replace({ name: 'voice' }) : undefined}
            />
          )}
          {top.name === 'voice' && (
            <VoiceSheet
              lang={DICTATION_LANG}
              onTranscript={confirmTranscript}
              onManual={() => replace({ name: 'form' })}
              onCancel={pop}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default App
