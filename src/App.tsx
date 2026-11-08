import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOverlayStack } from './app/useOverlayStack'
import { ExpenseDetail } from './features/expenses/ExpenseDetail'
import { ExpenseForm } from './features/expenses/ExpenseForm'
import { ExpensesScreen } from './features/expenses/ExpensesScreen'
import { HomeScreen } from './features/home/HomeScreen'
import { ComingSoonScreen } from './features/placeholders/ComingSoonScreen'

type Tab = 'home' | 'expenses' | 'summary' | 'settings'
type Overlay = { name: 'detail'; id: string } | { name: 'form'; id?: string }

const TABS: Tab[] = ['home', 'expenses', 'summary', 'settings']

function App() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('home')
  const { stack, push, pop } = useOverlayStack<Overlay>()
  const top = stack.at(-1)

  const openDetail = (id: string) => push({ name: 'detail', id })
  const openForm = (id?: string) => push({ name: 'form', id })

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <main className="flex-1 overflow-y-auto" inert={!!top}>
        {tab === 'home' && (
          <HomeScreen onAdd={() => openForm()} onOpen={openDetail} />
        )}
        {tab === 'expenses' && (
          <ExpensesScreen onAdd={() => openForm()} onOpen={openDetail} />
        )}
        {tab === 'summary' && (
          <ComingSoonScreen
            title={t('summary.title')}
            message={t('summary.soon')}
          />
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
            onClick={() => setTab(id)}
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
            <ExpenseForm key={top.id ?? 'new'} id={top.id} onDone={pop} />
          )}
        </div>
      )}
    </div>
  )
}

export default App
