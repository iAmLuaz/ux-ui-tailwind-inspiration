import { api } from '../api'
import type {
  ColumnaGetResponse as ColumnaData,
  ColumnaCampanaData,
  CreateColumnaLineaPayload,
  CreateColumnaCampanaPayload,
  UpdateColumnaLineaPayload,
  PatchColumnaLineaPayload,
  UpdateColumnaCampanaPayload,
  PatchColumnaCampanaPayload
} from '../../types/columnas/columna'

interface ApiClient {
  getColumnasByMapeo(mapeoId: string | number): Promise<ColumnaData[]>
  getColumnasLinea(): Promise<ColumnaData[]>
  getColumnasCampana(): Promise<ColumnaCampanaData[]>
  getColumnasCampanaByMapeo(mapeoId: string | number): Promise<ColumnaCampanaData[]>
  createColumnaLinea(
    mapeoId: string | number,
    payload: CreateColumnaLineaPayload
  ): Promise<any>
  updateColumnaLinea(mapeoId: string | number | undefined, payload: UpdateColumnaLineaPayload): Promise<any>
  patchActivarColumnaLinea(mapeoId: string | number, payload: PatchColumnaLineaPayload): Promise<any>
  patchDesactivarColumnaLinea(mapeoId: string | number, payload: PatchColumnaLineaPayload): Promise<any>
  createColumnaCampana(
    mapeoId: string | number,
    payload: CreateColumnaCampanaPayload
  ): Promise<any>
  createColumnaCampanaGlobal(payload: any): Promise<any>
  updateColumnaCampana(mapeoId: string | number | undefined, payload: UpdateColumnaCampanaPayload): Promise<any>
  patchActivarColumnaCampana(mapeoId: string | number, payload: PatchColumnaCampanaPayload): Promise<any>
  patchDesactivarColumnaCampana(mapeoId: string | number, payload: PatchColumnaCampanaPayload): Promise<any>
}

const apiClient = {
  getColumnasByMapeo: (mapeoId: string | number) =>
    api.getColumnasByMapeo(mapeoId),
  getColumnasLinea: () => api.getColumnasLinea(),
  getColumnasCampana: () => api.getColumnasCampana(),
  getColumnasCampanaByMapeo: (mapeoId: string | number) =>
    api.getColumnasCampanaByMapeo(mapeoId),
  createColumnaLinea: (mapeoId: string | number, payload: CreateColumnaLineaPayload) =>
    api.createColumnaLinea(mapeoId, payload),
  updateColumnaLinea: (mapeoId: string | number | undefined, payload: UpdateColumnaLineaPayload) =>
    api.updateColumnaLinea(mapeoId, payload),
  patchActivarColumnaLinea: (mapeoId: string | number, payload: PatchColumnaLineaPayload) =>
    api.patchActivarColumnaLinea(mapeoId, payload),
  patchDesactivarColumnaLinea: (mapeoId: string | number, payload: PatchColumnaLineaPayload) =>
    api.patchDesactivarColumnaLinea(mapeoId, payload),
  createColumnaCampana: (mapeoId: string | number, payload: CreateColumnaCampanaPayload) =>
    api.createColumnaCampana(mapeoId, payload),
  createColumnaCampanaGlobal: (payload: any) => api.createColumnaCampanaGlobal(payload),
  updateColumnaCampana: (mapeoId: string | number | undefined, payload: UpdateColumnaCampanaPayload) =>
    api.updateColumnaCampana(mapeoId, payload),
  patchActivarColumnaCampana: (mapeoId: string | number, payload: PatchColumnaCampanaPayload) =>
    api.patchActivarColumnaCampana(mapeoId, payload),
  patchDesactivarColumnaCampana: (mapeoId: string | number, payload: PatchColumnaCampanaPayload) =>
    api.patchDesactivarColumnaCampana(mapeoId, payload)
} as ApiClient

export const columnaService = {
  getColumnasByMapeo(mapeoId: string | number) {
    return apiClient.getColumnasByMapeo(mapeoId)
  },

  getColumnasLinea() {
    return apiClient.getColumnasLinea()
  },

  getColumnasCampana() {
    return apiClient.getColumnasCampana()
  },

  getColumnasCampanaByMapeo(mapeoId: string | number) {
    return apiClient.getColumnasCampanaByMapeo(mapeoId)
  },

  createColumnaLinea(mapeoId: string | number, payload: CreateColumnaLineaPayload) {
    return apiClient.createColumnaLinea(mapeoId, payload).then(res => {
      api.postBitacoraByContext('POST', `/lineas/mapeos/${mapeoId}/columnas`, payload, `Crear columna en mapeo ${mapeoId}`, payload.idUsuario ?? (payload as any).idABCUsuario ?? 1).catch(() => {})
      return res
    })
  },

  updateColumnaLinea(mapeoId: string | number | undefined, payload: UpdateColumnaLineaPayload) {
    return apiClient.updateColumnaLinea(mapeoId, payload).then(res => {
      const endpoint = mapeoId ? `/lineas/mapeos/${mapeoId}/columnas` : '/lineas/mapeos/columnas'
      api.postBitacoraByContext('PUT', endpoint, payload, `Actualizar columna`, payload.idUsuario ?? (payload as any).idABCUsuario ?? 1).catch(() => {})
      return res
    })
  },

  patchActivarColumnaLinea(mapeoId: string | number, payload: PatchColumnaLineaPayload) {
    return apiClient.patchActivarColumnaLinea(mapeoId, payload)
  },

  patchDesactivarColumnaLinea(mapeoId: string | number, payload: PatchColumnaLineaPayload) {
    return apiClient.patchDesactivarColumnaLinea(mapeoId, payload)
  },

  createColumnaCampana(mapeoId: string | number, payload: CreateColumnaCampanaPayload) {
    return apiClient.createColumnaCampana(mapeoId, payload).then(res => {
      api.postBitacoraByContext('POST', `/campanas/mapeos/${mapeoId}/columnas`, payload, `Crear columna en mapeo campana ${mapeoId}`, payload.idUsuario ?? (payload as any).idABCUsuario ?? 1).catch(() => {})
      return res
    })
  },

  createColumnaCampanaGlobal(payload: any) {
    return apiClient.createColumnaCampanaGlobal(payload).then(res => {
      api.postBitacoraByContext('POST', '/campanas/mapeos/0/columnas', payload, `Crear columna global de campana`, payload.idUsuario ?? payload.idABCUsuario ?? 1).catch(() => {})
      return res
    })
  },

  updateColumnaCampana(mapeoId: string | number | undefined, payload: UpdateColumnaCampanaPayload) {
    return apiClient.updateColumnaCampana(mapeoId, payload).then(res => {
      const endpoint = mapeoId ? `/campanas/mapeos/${mapeoId}/columnas` : '/campanas/mapeos/columnas'
      api.postBitacoraByContext('PUT', endpoint, payload, `Actualizar columna campana`, payload.idUsuario ?? (payload as any).idABCUsuario ?? 1).catch(() => {})
      return res
    })
  },

  patchActivarColumnaCampana(mapeoId: string | number, payload: PatchColumnaCampanaPayload) {
    return apiClient.patchActivarColumnaCampana(mapeoId, payload)
  },

  patchDesactivarColumnaCampana(mapeoId: string | number, payload: PatchColumnaCampanaPayload) {
    return apiClient.patchDesactivarColumnaCampana(mapeoId, payload)
  }
}
