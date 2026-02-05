import { ref } from 'vue'
import { mapeoService } from '@/services/mapeoService'
import type { MapeoCampanaData } from '@/types/mapeo'

interface Option {
  label: string
  value: number
  bolActivo?: boolean
}

export function useMapeosCampana() {
  const mapeos = ref<Option[]>([])
  const rawMapeos = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const list: MapeoCampanaData[] = await mapeoService.getMapeosCampana()
      rawMapeos.value = list

      mapeos.value = list.map(m => ({
        label: m.nombre || m.descripcion || `Mapeo ${Number(m.id ?? m.idABCConfigMapeoCampana ?? m.idABCConfigMapeoLinea)}`,
        value: Number(m.id ?? m.idABCConfigMapeoCampana ?? m.idABCConfigMapeoLinea),
        bolActivo: Boolean(m.bolActivo)
      }))
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { mapeos, rawMapeos, loading, error, fetchAll }
}