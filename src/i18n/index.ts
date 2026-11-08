import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en'
import es from '../locales/es'

export type AppLanguage = 'es' | 'en'

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export function intlLocale(lang: string): string {
  return lang.startsWith('en') ? 'en-US' : 'es-AR'
}

export default i18n
