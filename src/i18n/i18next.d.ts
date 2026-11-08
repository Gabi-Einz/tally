import 'i18next'
import type es from '../locales/es'

// Tipa las claves de t(): un error de tipeo en una clave no compila
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof es }
  }
}
