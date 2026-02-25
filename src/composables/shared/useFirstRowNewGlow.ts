import { onBeforeUnmount, ref, watch } from 'vue'

type RowKey = string | number

interface GlowOptions {
  durationMs?: number
  isLoading?: () => boolean
}

export function useFirstRowNewGlow<T>(
  rowsSource: () => T[],
  getRowKey: (row: T, index: number) => RowKey,
  options?: GlowOptions
) {
  const glowingRowKey = ref<RowKey | null>(null)
  const previousFirstRowKey = ref<RowKey | null>(null)
  const initialized = ref(false)
  const duration = Math.max(300, Number(options?.durationMs ?? 2200))
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const clearGlowTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const triggerGlow = () => {
    const rows = rowsSource()
    if (!rows.length) return
    const firstRow = rows[0]
    if (!firstRow) return

    clearGlowTimeout()
    glowingRowKey.value = getRowKey(firstRow, 0)
    timeoutId = setTimeout(() => {
      glowingRowKey.value = null
      timeoutId = null
    }, duration)
  }

  watch(
    () => rowsSource().length,
    (currentLength, previousLength) => {
      if (options?.isLoading?.()) return

      const rows = rowsSource()
      const firstRow = rows[0]
      const currentFirstKey = firstRow ? getRowKey(firstRow, 0) : null

      if (!initialized.value) {
        initialized.value = true
        previousFirstRowKey.value = currentFirstKey
        return
      }

      if (currentLength <= 0) {
        glowingRowKey.value = null
        previousFirstRowKey.value = null
        return
      }

      if (
        typeof previousLength === 'number'
        && previousLength > 0
        && currentLength > previousLength
        && currentFirstKey !== null
        && currentFirstKey !== previousFirstRowKey.value
      ) {
        triggerGlow()
      }

      previousFirstRowKey.value = currentFirstKey
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    clearGlowTimeout()
  })

  const isRowGlowing = (row: T, index: number) => {
    if (index !== 0 || glowingRowKey.value === null) return false
    return getRowKey(row, index) === glowingRowKey.value
  }

  return {
    isRowGlowing
  }
}
