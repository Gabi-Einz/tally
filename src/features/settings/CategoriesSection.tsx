import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { addCategory } from '../../db/categories'
import { categoryLabel, useCategories } from '../categories/useCategories'

const DEFAULT_COLOR = '#d6336c'

export function CategoriesSection() {
  const { t } = useTranslation()
  const { categories } = useCategories()
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [keywords, setKeywords] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    await addCategory({ name, color, keywords: keywords.split(',') })
    setName('')
    setKeywords('')
    setColor(DEFAULT_COLOR)
  }

  return (
    <section aria-labelledby="categories-title">
      <h2 id="categories-title" className="font-semibold">
        {t('settings.categories.title')}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-sm"
          >
            <span
              className="size-2 flex-none rounded-full"
              style={{ background: category.color }}
              aria-hidden="true"
            />
            {categoryLabel(category, t)}
          </li>
        ))}
      </ul>
      <form
        onSubmit={onSubmit}
        className="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-card p-4"
      >
        <div className="flex items-end gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            {t('settings.categories.name')}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
              className="rounded-xl border border-line bg-card px-3 py-2 text-base"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('settings.categories.color')}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-12 rounded-xl border border-line bg-card"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {t('settings.categories.keywords')}
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={t('settings.categories.keywordsPlaceholder')}
            className="rounded-xl border border-line bg-card px-3 py-2 text-base"
          />
        </label>
        <p className="text-sm text-muted">{t('settings.categories.help')}</p>
        <button
          type="submit"
          className="self-start rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-brand"
        >
          {t('settings.categories.add')}
        </button>
      </form>
    </section>
  )
}
