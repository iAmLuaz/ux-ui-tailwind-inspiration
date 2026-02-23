import { ref } from 'vue'
import { columnaService } from '@/services/columnas/columnaService'
import { adaptColumnaCampana } from '@/adapters/columnas/campana/columnaCampana.adapter'
import type { ColumnaCampanaModel } from '@/models/columnas/campana/columnaCampana.model'

export function useColumnasCampana() {
    const items = ref<ColumnaCampanaModel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
    const currentMapeo = ref<string | number | null>(null)
    const rawResponse = ref<any>(null)

  async function fetchAll(mapeoId?: string | number | null) {
    loading.value = true
    error.value = null
    try {
      let raw
      if (mapeoId !== undefined && mapeoId !== null) {
        currentMapeo.value = mapeoId
        raw = await columnaService.getColumnasCampanaByMapeo(mapeoId)
      } else if (currentMapeo.value !== null) {
        raw = await columnaService.getColumnasCampanaByMapeo(currentMapeo.value)
      } else {
        raw = await columnaService.getColumnasCampana()
      }

      console.debug('[useColumnasCampana] fetchAll mapeoId=', mapeoId, 'raw=', raw)
        rawResponse.value = raw
      const list = ((): any[] => {
        if (Array.isArray(raw)) return raw
        if (raw && typeof raw === 'object') {
          if (Array.isArray((raw as any).data)) return (raw as any).data
          if (Array.isArray((raw as any).items)) return (raw as any).items
          return [raw]
        }
        return []
      })()
      items.value = list.map(adaptColumnaCampana)

      console.debug('[useColumnasCampana] normalized items length=', items.value.length, items.value.slice?.(0,5))
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function toggle(item: ColumnaCampanaModel) {
    loading.value = true
    try {
      const wasActive = item.bolActivo
      const fn = wasActive
        ? columnaService.patchDesactivarColumnaCampana
        : columnaService.patchActivarColumnaCampana

      const mapeoCandidates = Array.from(new Set([
        Number((item as any)?.mapeoId ?? 0),
        Number((item as any)?.idABCConfigMapeoCampana ?? 0),
        Number((item as any)?.idABCConfigMapeoLinea ?? 0),
        Number(currentMapeo.value ?? 0)
      ].filter((id) => Number.isFinite(id) && id >= 0)))

      let patched = false
      let lastError: any = null

      for (const mapeoId of mapeoCandidates) {
        try {
          await fn(mapeoId, { columna: { tipo: { id: item.columnaId } }, idUsuario: 1 })
          patched = true
          break
        } catch (e: any) {
          lastError = e
          if (Number(e?.status ?? 0) !== 404) throw e
        }
      }

      if (!patched && lastError) {
        throw lastError
      }

      await fetchAll(currentMapeo.value)
    } finally {
      loading.value = false
    }
  }

    async function create(payload: {
        idABCConfigMapeoCampana: number
        idABCCatColumna: number
        regex: string
        }) {
        loading.value = true
        try {
      await columnaService.createColumnaCampanaGlobal({
      idUsuario: 1,
      columna: {
        tipo: { id: payload.idABCCatColumna },
        regex: payload.regex ?? null
      }
      })
            await fetchAll()
        } finally {
            loading.value = false
        }
        }
    async function update(payload: {
    idABCConfigMapeoCampana: number
    idABCCatColumna: number
    regex: string
    }) {
        loading.value = true
        try {
      await columnaService.updateColumnaCampana(payload.idABCConfigMapeoCampana, {
        idUsuario: 1,
        columna: {
          tipo: { id: payload.idABCCatColumna },
          regex: payload.regex
        }
      })
            await fetchAll()
        } finally {
            loading.value = false
        }
    }


  return {
    items,
    loading,
    error,
    fetchAll,
    toggle,
        create,
        update
    , rawResponse
  }
}
