export interface Token {
  original: string
  norm: string
  used: boolean
}

export function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function tokenize(text: string): Token[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/^[¿¡"“”'(]+|[?!.,;:"“”')]+$/g, ''))
    .filter(Boolean)
    .map((original) => ({
      original,
      norm: normalizeWord(original),
      used: false,
    }))
}

export function remainingText(
  tokens: Token[],
  fillers: Set<string>,
  edgeWords: Set<string>,
): string {
  const words = tokens.filter((t) => !t.used && !fillers.has(t.norm))
  let start = 0
  let end = words.length
  while (start < end && edgeWords.has(words[start].norm)) start++
  while (end > start && edgeWords.has(words[end - 1].norm)) end--
  const text = words
    .slice(start, end)
    .map((t) => t.original)
    .join(' ')
  return text.charAt(0).toLocaleUpperCase() + text.slice(1)
}
