import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { OTHER_CATEGORY_ID } from '../../data/categories'
import {
  addCategory,
  deleteCategory,
  updateCategory,
  type CategoryInput,
} from '../../db/categories'
import type { Category } from '../../db/types'
import {
  appLanguage,
  categoryLabel,
  useCategories,
} from '../categories/useCategories'

const DEFAULT_COLOR = '#d6336c'

export function CategoriesSection() {
  const { t } = useTranslation()
  const { categories } = useCategories()
  const [editingId, setEditingId] = useState<string | null>(null)

  async function save(category: Category, input: CategoryInput) {
    // Si no se cambió el nombre, no se fija para este idioma
    const unchanged = input.name?.trim() === categoryLabel(category, t)
    await updateCategory(
      category.id,
      { ...input, name: unchanged ? null : input.name },
      appLanguage(),
    )
    setEditingId(null)
  }

  return (
    <section aria-labelledby="categories-title">
      <h2 id="categories-title" className="font-semibold">
        {t('settings.categories.title')}
      </h2>
      <ul className="mt-2 rounded-2xl border border-line bg-card px-4">
        {categories.map((category) => {
          const label = categoryLabel(category, t)
          return (
            <li
              key={category.id}
              className="border-b border-line py-3 last:border-b-0"
            >
              {editingId === category.id ? (
                <CategoryForm
                  key={category.id}
                  initial={{
                    name: label,
                    color: category.color,
                    keywords: category.keywords,
                  }}
                  submitLabel={t('settings.categories.save')}
                  onSubmit={(input) => save(category, input)}
                  onCancel={() => setEditingId(null)}
                  onDelete={
                    category.id === OTHER_CATEGORY_ID
                      ? undefined
                      : () => deleteCategory(category.id)
                  }
                  deleteQuestion={t('settings.categories.confirmDelete', {
                    name: label,
                  })}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className="size-2.5 flex-none rounded-full"
                    style={{ background: category.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <button
                    type="button"
                    onClick={() => setEditingId(category.id)}
                    aria-label={t('settings.categories.edit', { name: label })}
                    className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand"
                  >
                    {t('detail.edit')}
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <h3 className="mt-4 text-sm font-semibold">
        {t('settings.categories.new')}
      </h3>
      <div className="mt-2 rounded-2xl border border-line bg-card p-4">
        <CategoryForm
          initial={{ name: '', color: DEFAULT_COLOR, keywords: [] }}
          submitLabel={t('settings.categories.add')}
          resetOnSubmit
          onSubmit={addCategory}
        />
      </div>
    </section>
  )
}

interface FormProps {
  initial: { name: string; color: string; keywords: string[] }
  submitLabel: string
  resetOnSubmit?: boolean
  onSubmit: (input: CategoryInput) => Promise<unknown>
  onCancel?: () => void
  onDelete?: () => Promise<void>
  deleteQuestion?: string
}

function CategoryForm({
  initial,
  submitLabel,
  resetOnSubmit,
  onSubmit,
  onCancel,
  onDelete,
  deleteQuestion,
}: FormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial.name)
  const [color, setColor] = useState(initial.color)
  const [keywords, setKeywords] = useState(initial.keywords.join(', '))
  const [confirming, setConfirming] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    await onSubmit({ name, color, keywords: keywords.split(',') })
    if (resetOnSubmit) {
      setName(initial.name)
      setColor(initial.color)
      setKeywords(initial.keywords.join(', '))
    }
  }

  if (confirming && onDelete)
    return (
      <div role="alertdialog" aria-labelledby="confirm-delete-category">
        <p id="confirm-delete-category" className="mb-3 font-semibold">
          {deleteQuestion}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-xl border border-line bg-card py-2 font-semibold"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl bg-danger py-2 font-semibold text-on-brand"
          >
            {t('detail.confirmDeleteYes')}
          </button>
        </div>
      </div>
    )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-brand"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
          >
            {t('common.cancel')}
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="ml-auto rounded-full px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/10"
          >
            {t('detail.delete')}
          </button>
        )}
      </div>
    </form>
  )
}
