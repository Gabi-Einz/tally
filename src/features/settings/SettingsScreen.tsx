import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../../components/ScreenHeader'
import { db } from '../../db/db'
import { deleteRule } from '../../db/rules'
import { categoryLabel, useCategories } from '../categories/useCategories'

export function SettingsScreen() {
  const { t } = useTranslation()
  const { byId } = useCategories()
  const rules = useLiveQuery(() => db.rules.orderBy('pattern').toArray(), [])

  return (
    <>
      <ScreenHeader title={t('settings.title')} />
      <div className="flex flex-col gap-6 px-4 pb-6">
        <section aria-labelledby="rules-title">
          <h2 id="rules-title" className="font-semibold">
            {t('settings.rules.title')}
          </h2>
          <p className="mb-2 text-sm text-muted">{t('settings.rules.help')}</p>
          {rules && rules.length === 0 && (
            <p className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">
              {t('settings.rules.empty')}
            </p>
          )}
          {rules && rules.length > 0 && (
            <ul className="rounded-2xl border border-line bg-white px-4">
              {rules.map((rule) => {
                const category = byId.get(rule.categoryId)
                return (
                  <li
                    key={rule.id}
                    className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono">
                        {rule.pattern}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-muted">
                        <span
                          className="size-2 flex-none rounded-full"
                          style={{ background: category?.color }}
                          aria-hidden="true"
                        />
                        {categoryLabel(category, t)} ·{' '}
                        {t('settings.rules.hits', { count: rule.hits })}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.id)}
                      aria-label={t('settings.rules.delete', {
                        pattern: rule.pattern,
                      })}
                      className="rounded-full px-3 py-1.5 text-sm font-semibold text-danger hover:bg-danger/10"
                    >
                      {t('detail.delete')}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <p className="text-center text-sm text-muted">{t('settings.soon')}</p>
      </div>
    </>
  )
}
