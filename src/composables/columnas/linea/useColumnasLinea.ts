import { ref } from 'vue'
import { columnaService } from '@/services/columnas/columnaService'
import { adaptColumnasLinea } from '@/adapters/columnas/linea/columnaLinea.adapter'
import type { ColumnaLineaModel } from '@/models/columnas/linea/columnaLinea.model'

export function useColumnasLinea() {
  const items = ref<ColumnaLineaModel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentMapeo = ref<string | number | null>(null)

  async function fetchAll(mapeoId?: string | number | null) {
    loading.value = true
    error.value = null
    try {
      let raw
      if (mapeoId !== undefined && mapeoId !== null) {
        currentMapeo.value = mapeoId
        raw = await columnaService.getColumnasByMapeo(mapeoId)
      } else if (currentMapeo.value !== null) {
        raw = await columnaService.getColumnasByMapeo(currentMapeo.value)
      } else {
        raw = await columnaService.getColumnasLinea()
      }
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

      const mapeoId = currentMapeo.value ?? item.mapeoId ?? 0
      await fn(mapeoId, { columna: { tipo: { id: item.columnaId } }, idUsuario: 1 })

      await fetchAll(currentMapeo.value)
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, fetchAll, toggle }
}
