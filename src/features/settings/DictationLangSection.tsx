import { useTranslation } from 'react-i18next'
import type { DictationLang } from '../../db/types'
import { setDictationLang, useDictationLang } from '../voice/dictationLang'

const OPTIONS: DictationLang[] = ['es-AR', 'en-US']

export function DictationLangSection() {
  const { t } = useTranslation()
  const lang = useDictationLang()

  return (
    <section aria-labelledby="dictation-title">
      <h2 id="dictation-title" className="font-semibold">
        {t('settings.dictation.title')}
      </h2>
      <div
        role="group"
        aria-labelledby="dictation-title"
        className="mt-2 flex gap-1 rounded-xl bg-sunk p-1"
      >
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={lang === option}
            onClick={() => setDictationLang(option)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm ${
              lang === option ? 'bg-card font-semibold shadow-sm' : 'text-muted'
            }`}
          >
            {t(`settings.dictation.${option}`)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">{t('settings.dictation.help')}</p>
    </section>
  )
}
