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
    errors: {
      amount: 'Enter an amount greater than 0, for example 2.300 or 2.300,50.',
      date: 'Pick a date.',
      description: 'Enter a description, for example "Pharmacy".',
    },
  },
  voice: {
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
  summary: {
    title: 'Summary',
    total: 'Total',
    legend: 'Expenses by category',
    chartLabel: 'Pie chart of expenses by category. Total: {{total}}',
    empty: 'No expenses in {{month}}.',
  },
  settings: {
    title: 'Settings',
    soon: 'Settings arrive in upcoming phases.',
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
