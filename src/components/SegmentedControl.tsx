interface Props<T extends string> {
  label: string
  options: { value: T; label: string; disabled?: boolean }[]
  value: T | undefined
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex gap-1 rounded-xl bg-sunk p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-lg px-2 py-2 text-sm disabled:opacity-40 ${
            value === option.value
              ? 'bg-card font-semibold shadow-sm'
              : 'text-muted'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
