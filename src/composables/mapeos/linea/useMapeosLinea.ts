import { ref } from 'vue'
import { mapeoLineaService } from '@/services/mapeos/linea/mapeoLineaService'
import type { MapeoLineaData } from '@/types/mapeos/linea'

interface Option {
  label: string
  value: number
}

export function useMapeosLinea() {
  const mapeos = ref<Option[]>([])
  const rawMapeos = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const list: MapeoLineaData[] = await mapeoLineaService.getAllMapeos()
      rawMapeos.value = list
      mapeos.value = list
        .filter(m => m.bolActivo)
        .map(m => ({
          label: m.nombre || m.descripcion || `Mapeo ${m.idABCConfigMapeoLinea}`,
          value: m.idABCConfigMapeoLinea
        }))
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    mapeos,
    rawMapeos,
    loading,
    error,
    fetchAll
  }
}
