// src/composables/useColumnasLinea.ts
import { ref } from 'vue'
import { columnaService } from '@/services/columnaService'
import { adaptColumnasLinea } from '@/adapters/columnaLinea.adapter'
import type { ColumnaLineaModel } from '@/models/columnaLinea.model'

export function useColumnasLinea() {
  const items = ref<ColumnaLineaModel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const raw = await columnaService.getColumnasLinea()
      items.value = adaptColumnasLinea(raw)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function toggle(item: any) {
    loading.value = true
    try {
      const fn = item.bolActivo
        ? columnaService.patchDesactivarColumnaLinea
        : columnaService.patchActivarColumnaLinea

      await fn({
        idABCConfigMapeoLinea: item.mapeoId,
        idABCCatColumna: item.columnaId,
        idUsuario: 1
      })

      await fetchAll()
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, fetchAll, toggle }
}
