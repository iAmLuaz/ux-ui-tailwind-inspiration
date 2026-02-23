import { api } from '../../api'
import type { MapeoLineaData } from '@/types/mapeos/linea'
import { normalizeMapeosLinea } from '@/adapters/mapeos/linea/mapeoLinea.adapter'

interface ApiClient {
  getMapeosByLinea(lineaId: string | number): Promise<MapeoLineaData[]>
  getAllMapeos(): Promise<MapeoLineaData[]>
  createMapeoLinea(lineaId: string | number, payload: any): Promise<MapeoLineaData>
  updateMapeoLinea(payload: any): Promise<MapeoLineaData>
  deleteMapeoLinea(lineaId: string | number, mapeoId: string | number): Promise<void>
  patchActivarMapeoLinea(payload: any): Promise<MapeoLineaData>
  patchDesactivarMapeoLinea(payload: any): Promise<MapeoLineaData>
}

const apiClient = api as ApiClient

export const mapeoLineaService = {
  getMapeos(lineaId: string | number) {
    return apiClient.getMapeosByLinea(lineaId).then(normalizeMapeosLinea)
  },

  getAllMapeos() {
    return apiClient.getAllMapeos().then(res => normalizeMapeosLinea(res))
  },

  createMapeo(lineaId: string | number, payload: any) {
    const normalized = {
      mapeo: payload.mapeo ?? payload.mapeos ?? {},
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      validar: payload.validar ?? payload.mapeo?.validar ?? true,
      enviar: payload.enviar ?? payload.envio ?? payload.mapeo?.enviar ?? payload.mapeo?.envio ?? true
    }
    return apiClient.createMapeoLinea(lineaId, normalized).then(res => {
      api
        .postBitacoraByContext(
          'POST',
          `/lineas/${lineaId}/mapeos`,
          normalized,
          `Crear mapeo linea ${lineaId}`,
          normalized.idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  updateMapeo(payload: any) {
    const mapeoData = payload.mapeo ?? payload.mapeos ?? {}
    const normalized = {
      mapeo: mapeoData,
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      validar: payload.validar ?? mapeoData.validar ?? false,
      enviar: payload.enviar ?? payload.envio ?? mapeoData.enviar ?? mapeoData.envio ?? false
    }
    return apiClient.updateMapeoLinea(normalized).then(res => {
      api
        .postBitacoraByContext(
          'PUT',
          '/lineas/mapeos',
          normalized,
          'Actualizar mapeo',
          normalized.idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  deleteMapeo(lineaId: string | number, mapeoId: string | number) {
    return apiClient.deleteMapeoLinea(lineaId, mapeoId)
  },

  patchActivarMapeoLinea(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchActivarMapeoLinea(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/mapeos/activar',
          payload,
          `Activar mapeo ${mapeoId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  patchDesactivarMapeoLinea(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchDesactivarMapeoLinea(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/mapeos/desactivar',
          payload,
          `Desactivar mapeo ${mapeoId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  }
}
