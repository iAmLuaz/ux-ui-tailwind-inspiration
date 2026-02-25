export function normalizeSearchText(value: unknown) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  try {
    return text
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim()
  } catch {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }
}

export function matchesTokenizedSearch(sourceValue: unknown, queryValue: unknown) {
  const query = normalizeSearchText(queryValue)
  if (!query) return true

  const source = normalizeSearchText(sourceValue)
  const sourceWords = source.split(/\s+/).filter(Boolean)
  const queryTokens = query.split(/\s+/).filter(Boolean)

  if (queryTokens.length === 1) {
    const token = queryTokens[0] ?? ''
    return sourceWords.some(word => word.includes(token)) || source.includes(token)
  }

  return queryTokens.every(token => sourceWords.some(word => word.includes(token)))
}

export function matchesSearchContains(sourceValue: unknown, queryValue: unknown) {
  const query = normalizeSearchText(queryValue)
  if (!query) return true
  return normalizeSearchText(sourceValue).includes(query)
}

export function toSafeTimestamp(value?: string) {
  const parsed = value ? Date.parse(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : -1
}

export function compareNewestFirst(leftDate?: string, rightDate?: string, leftId = 0, rightId = 0) {
  const leftTimestamp = toSafeTimestamp(leftDate)
  const rightTimestamp = toSafeTimestamp(rightDate)
  if (rightTimestamp !== leftTimestamp) return rightTimestamp - leftTimestamp
  return Number(rightId) - Number(leftId)
}