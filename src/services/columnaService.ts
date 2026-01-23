import { api } from './api'
import { mockColumnasApi } from './mockData'
import type {
  ColumnaData,
  ColumnaCampanaData,
  CreateColumnaLineaPayload,
  UpdateColumnaLineaPayload,
  PatchColumnaLineaPayload,
  UpdateColumnaCampanaPayload,
  PatchColumnaCampanaPayload
} from '../types/columna'

interface ApiClient {
  getColumnasByMapeo(mapeoId: string | number): Promise<ColumnaData[]>
  getColumnasCampana(): Promise<ColumnaCampanaData[]>
  getColumnasCampanaByMapeo(mapeoId: string | number): Promise<ColumnaCampanaData[]>
  createColumnaLinea(
    mapeoId: string | number,
    payload: CreateColumnaLineaPayload
  ): Promise<any>
  updateColumnaLinea(payload: UpdateColumnaLineaPayload): Promise<any>
  patchActivarColumnaLinea(payload: PatchColumnaLineaPayload): Promise<any>
  patchDesactivarColumnaLinea(payload: PatchColumnaLineaPayload): Promise<any>
  createColumnaCampana(
    mapeoId: string | number,
    payload: CreateColumnaLineaPayload
  ): Promise<any>
  updateColumnaCampana(payload: UpdateColumnaCampanaPayload): Promise<any>
  patchActivarColumnaCampana(payload: PatchColumnaCampanaPayload): Promise<any>
  patchDesactivarColumnaCampana(payload: PatchColumnaCampanaPayload): Promise<any>
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const apiClient = (USE_MOCK ? mockColumnasApi : {
  getColumnasByMapeo: (mapeoId: string | number) =>
    api.getColumnasByMapeo(mapeoId),
  getColumnasCampana: () => api.getColumnasCampana(),
  getColumnasCampanaByMapeo: (mapeoId: string | number) =>
    api.getColumnasCampanaByMapeo(mapeoId),
  createColumnaLinea: (mapeoId: string | number, payload: CreateColumnaLineaPayload) =>
    api.createColumnaLinea(mapeoId, payload),
  updateColumnaLinea: (payload: UpdateColumnaLineaPayload) =>
    api.updateColumnaLinea(payload),
  patchActivarColumnaLinea: (payload: PatchColumnaLineaPayload) =>
    api.patchActivarColumnaLinea(payload),
  patchDesactivarColumnaLinea: (payload: PatchColumnaLineaPayload) =>
    api.patchDesactivarColumnaLinea(payload),
  createColumnaCampana: (mapeoId: string | number, payload: CreateColumnaLineaPayload) =>
    api.createColumnaCampana(mapeoId, payload),
  updateColumnaCampana: (payload: UpdateColumnaCampanaPayload) =>
    api.updateColumnaCampana(payload),
  patchActivarColumnaCampana: (payload: PatchColumnaCampanaPayload) =>
    api.patchActivarColumnaCampana(payload),
  patchDesactivarColumnaCampana: (payload: PatchColumnaCampanaPayload) =>
    api.patchDesactivarColumnaCampana(payload)
}) as ApiClient

export const columnaService = {
  getColumnasByMapeo(mapeoId: string | number) {
    return apiClient.getColumnasByMapeo(mapeoId)
  },

  getColumnasCampana() {
    return apiClient.getColumnasCampana()
  },

  getColumnasCampanaByMapeo(mapeoId: string | number) {
    return apiClient.getColumnasCampanaByMapeo(mapeoId)
  },

  createColumnaLinea(mapeoId: string | number, payload: CreateColumnaLineaPayload) {
    return apiClient.createColumnaLinea(mapeoId, payload)
  },

  updateColumnaLinea(payload: UpdateColumnaLineaPayload) {
    return apiClient.updateColumnaLinea(payload)
  },

  patchActivarColumnaLinea(payload: PatchColumnaLineaPayload) {
    return apiClient.patchActivarColumnaLinea(payload)
  },

  patchDesactivarColumnaLinea(payload: PatchColumnaLineaPayload) {
    return apiClient.patchDesactivarColumnaLinea(payload)
  },

  createColumnaCampana(mapeoId: string | number, payload: CreateColumnaLineaPayload) {
    return apiClient.createColumnaCampana(mapeoId, payload)
  },

  updateColumnaCampana(payload: UpdateColumnaCampanaPayload) {
    return apiClient.updateColumnaCampana(payload)
  },

  patchActivarColumnaCampana(payload: PatchColumnaCampanaPayload) {
    return apiClient.patchActivarColumnaCampana(payload)
  },

  patchDesactivarColumnaCampana(payload: PatchColumnaCampanaPayload) {
    return apiClient.patchDesactivarColumnaCampana(payload)
  }
}