import type es from './es'

const en: typeof es = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
    loading: 'Loading…',
  },
  nav: {
    home: 'Home',
    expenses: 'Expenses',
    summary: 'Summary',
    settings: 'Settings',
  },
  home: {
    backupStale:
      "It's been more than 3 days since the last Google Drive backup. Check Settings.",
    install: 'Install app',
    monthTotal: 'Spent in {{month}}',
    add: 'Add expense',
    speak: 'Say your expense',
    speakHint: 'E.g. “I spent 5000 on the bus”',
    manual: 'Add manually',
    voiceUnsupported:
      "This browser doesn't support voice recognition. You can add expenses manually.",
    recent: 'Recent expenses',
    empty: "You haven't added any expenses yet.",
  },
  expenses: {
    title: 'Expenses',
    addManual: 'Manual',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    filterAll: 'All',
    filterLabel: 'Filter by category',
    today: 'Today',
    yesterday: 'Yesterday',
    emptyMonth: 'No expenses in {{month}}.',
    emptyFilter: 'No expenses in this category in {{month}}.',
  },
  detail: {
    originalUsd: 'Original amount: {{amount}}',
    title: 'Details',
    description: 'Description',
    category: 'Category',
    origin: 'Source',
    manualEntry: 'Manual entry',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: "Delete this expense? This can't be undone.",
    confirmDeleteYes: 'Yes, delete',
    notFound: 'This expense no longer exists.',
  },
  form: {
    currency: 'Amount currency',
    currencies: { ARS: 'Pesos', USD: 'Dollars' },
    estimate: '≈ {{amount}} (blue {{rate}})',
    estimateRate: 'Blue dollar: {{rate}}',
    estimateOffline:
      "It's converted to pesos with the blue dollar when you're online.",
    titleNew: 'New expense',
    titleEdit: 'Edit expense',
    amount: 'Amount',
    amountPlaceholder: 'E.g. 2,300',
    date: 'Date',
    description: 'Description',
    descriptionPlaceholder: 'E.g. Pharmacy',
    category: 'Category',
    save: 'Save',
    saveChanges: 'Save changes',
    titleConfirm: 'Confirm expense',
    retry: 'Retry',
    suggestion: {
      rule: 'Learned rule · {{percent}}%',
      keyword: 'Keyword · {{percent}}%',
      embedding: 'Similar meaning · {{percent}}%',
      manual: 'Chosen manually',
      fallback: 'No matches: check the category',
    },
    errors: {
      amount: 'Enter an amount greater than 0, for example 2.300 or 2.300,50.',
      date: 'Pick a date.',
      description: 'Enter a description, for example "Pharmacy".',
    },
  },
  voice: {
    engineLocal: 'Local',
    introLocal:
      'Tally needs the microphone to hear your expense. The audio is processed on your phone and never leaves the device.',
    recording: 'Recording… tap Done when you finish.',
    transcribing: 'Transcribing on your phone…',
    downloadingModel: 'Downloading the voice model… {{percent}}%',
    title: 'Voice entry',
    intro:
      'Tally needs the microphone to hear your expense. Chrome processes the audio on Google servers and only while you speak.',
    allow: 'Allow and speak',
    engineChrome: 'Chrome',
    listening: 'Listening…',
    example: 'E.g. “yesterday I paid 2300 at the pharmacy”',
    done: 'Done',
    retry: 'Try again',
    manual: 'Add manually',
    errors: {
      unsupported:
        "This browser doesn't support voice recognition. Try Chrome or add the expense manually.",
      'not-allowed':
        "There's no permission to use the microphone. Enable it in Chrome's site settings and try again.",
      'no-speech':
        "I didn't hear anything. Move closer to the microphone and try again.",
      network:
        "Chrome's recognition needs internet. Check your connection or add the expense manually.",
      aborted: 'Recording was canceled.',
      unknown:
        "The microphone couldn't be used. Try again or add the expense manually.",
    },
  },
  currency: {
    pesosPending:
      "Pesos pending: calculated with the blue dollar when you're online.",
    rates: 'Saved exchange rates',
    equivalents: 'Equivalents',
    usdBlue: 'USD blue',
    usdt: 'USDT',
    blue: 'blue',
    pending: 'USD pending',
    unavailable: 'No rate',
    sources: {
      dolarapi: 'DolarAPI · {{time}}',
      argentinadatos: 'ArgentinaDatos · rate for {{date}}',
    },
  },
  summary: {
    currencyLabel: 'Chart currency',
    currencies: { ARS: 'ARS', USD_BLUE: 'USD blue', USD_CRIPTO: 'USD crypto' },
    missing_one:
      "{{count}} expense doesn't have a rate yet and isn't included.",
    missing_other:
      "{{count}} expenses don't have a rate yet and aren't included.",
    title: 'Summary',
    total: 'Total',
    legend: 'Expenses by category',
    chartLabel: 'Pie chart of expenses by category. Total: {{total}}',
    empty: 'No expenses in {{month}}.',
  },
  settings: {
    title: 'Settings',
    soon: 'More settings arrive in upcoming phases.',
    dictation: {
      title: 'Dictation language',
      'es-AR': 'Español',
      'en-US': 'English',
      help: 'The language you dictate expenses in. Independent from the app language.',
    },
    voice: {
      title: 'Voice engine',
      auto: 'Automatic',
      chrome: 'Chrome only',
      whisper: 'Whisper only',
      autoHelp:
        'Uses Chrome when online and Whisper on your phone when offline.',
      chromeHelp:
        "Always uses Chrome's recognition. Dictation won't work offline.",
      whisperHelp:
        'Always uses Whisper on your phone: the audio never leaves the device.',
      chromeUnavailable: "This browser doesn't have Chrome's recognition.",
    },
    drive: {
      title: 'Google Drive backup',
      help: "Saves a copy of your expenses in a hidden folder of your Google Drive. Tally can't see your other files.",
      notConfigured:
        "Drive backup isn't configured in this installation (VITE_GOOGLE_CLIENT_ID is missing, see README).",
      connect: 'Connect Google Drive',
      lastToday: 'Last backup: today {{time}}',
      lastDate: 'Last backup: {{date}}',
      never: 'No backup yet.',
      backupNow: 'Back up now',
      reconnect: 'Reconnect',
      restore: 'Restore',
      disconnect: 'Disconnect',
      backedUp: 'Backup saved to Drive.',
      backupFailed: "Couldn't back up. Check your connection and try again.",
      restored_one: '{{count}} expense restored.',
      restored_other: '{{count}} expenses restored.',
      noBackup: "There's no backup in your Drive.",
      remoteFound:
        'We found a backup in your Drive. Tap Restore to recover your expenses.',
      authFailed: "Couldn't connect to Google. Try again.",
      errors: {
        offline: 'Offline: the backup runs when the connection is back.',
        auth: 'Your Google session expired. Tap Reconnect.',
        network: "Couldn't back up. It retries with the next change.",
      },
    },
    models: {
      whisper: 'On-device voice recognition (Whisper)',
      whisperHelp: 'Downloaded once (~80 MB) to dictate offline.',
      title: 'On-device models',
      e5: 'Meaning-based categorization (e5)',
      e5Help: 'Downloaded once (~120 MB) and works offline.',
      idle: 'Pending',
      loading: 'Downloading… {{percent}}%',
      ready: 'Ready',
      unavailable: 'Not available in this browser',
      error: "Couldn't download. It retries when the app opens.",
    },
    rules: {
      title: 'Learned rules',
      help: 'When you correct a category, Tally remembers the word and uses it next time.',
      empty:
        'No rules yet. They are created when you correct an expense category.',
      hits_one: '{{count}} time',
      hits_other: '{{count}} times',
      delete: 'Delete the rule "{{pattern}}"',
    },
  },
  categories: {
    supermercado: 'Groceries',
    comida: 'Food & restaurants',
    transporte: 'Transportation',
    servicios: 'Utilities',
    vivienda: 'Housing / Rent',
    salud: 'Health',
    entretenimiento: 'Entertainment',
    ropa: 'Clothing',
    educacion: 'Education',
    suscripciones: 'Subscriptions',
    mascotas: 'Pets',
    regalos: 'Gifts',
    otros: 'Other',
  },
}

export default en
