import { useTranslation } from 'react-i18next'
import {
  setAppLanguage,
  setThemePreference,
  useAppLanguage,
  useThemePreference,
} from '../../app/preferences'
import { SegmentedControl } from '../../components/SegmentedControl'

export function AppearanceSection() {
  const { t } = useTranslation()
  const lang = useAppLanguage()
  const theme = useThemePreference()

  return (
    <section aria-labelledby="appearance-title" className="flex flex-col gap-3">
      <h2 id="appearance-title" className="font-semibold">
        {t('settings.appearance.title')}
      </h2>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">
          {t('settings.appearance.language')}
        </span>
        <SegmentedControl
          label={t('settings.appearance.language')}
          value={lang}
          onChange={setAppLanguage}
          options={[
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
          ]}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">
          {t('settings.appearance.theme')}
        </span>
        <SegmentedControl
          label={t('settings.appearance.theme')}
          value={theme}
          onChange={setThemePreference}
          options={[
            { value: 'system', label: t('settings.appearance.system') },
            { value: 'light', label: t('settings.appearance.light') },
            { value: 'dark', label: t('settings.appearance.dark') },
          ]}
        />
      </div>
    </section>
  )
}
