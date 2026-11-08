import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  title: string
  onBack?: () => void
  action?: ReactNode
}

export function ScreenHeader({ title, onBack, action }: Props) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-surface/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={t('common.back')}
          className="-ml-2 grid size-10 place-items-center rounded-full text-2xl text-muted hover:bg-sunk"
        >
          ‹
        </button>
      )}
      <h1 className="flex-1 text-xl font-bold">{title}</h1>
      {action}
    </header>
  )
}
